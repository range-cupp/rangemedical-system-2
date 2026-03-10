#!/usr/bin/env python3
"""
Primex PDF Lab Parser — Range Medical CRM
Extracts lab values from Primex reports and generates SQL for import.
Uploads per-patient PDFs to Supabase Storage and sets pdf_url on lab rows.

Handles single-patient PDFs and combined multi-patient PDFs
(reports separated by "END OF REPORT" markers).

Usage:
    python3 primex_parser.py /path/to/pdf/folder
    python3 primex_parser.py  (defaults to uploads folder)
"""

import sys, os, re
from pathlib import Path

# ── Dependencies ─────────────────────────────────────────────────────────────
for pkg in ['pdfplumber', 'pypdf', 'supabase']:
    try:
        __import__(pkg.replace('-', '_'))
    except ImportError:
        os.system(f"pip install {pkg} --break-system-packages -q")

import pdfplumber
from pypdf import PdfReader, PdfWriter
from supabase import create_client

# ── Supabase config (read from CRM .env.local) ───────────────────────────────
_ENV_PATH = Path(__file__).parent / 'mnt/Claude CUPP 2nd brain/Range Medical CRM/rangemedical-system-2/.env.local'

def _load_env():
    env = {}
    if _ENV_PATH.exists():
        for line in _ENV_PATH.read_text().splitlines():
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env

_ENV = _load_env()
SUPABASE_URL = _ENV.get('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_KEY = _ENV.get('SUPABASE_SERVICE_ROLE_KEY', '')
STORAGE_BUCKET = 'lab-documents'
STORAGE_PREFIX = 'primex'

# ── Lab value patterns: (regex, db_column) ──────────────────────────────────
# Captures values as [<>]?[\d.,]+ to handle out-of-range notation (>1,500 / <10.0).
# parse_values() strips <, >, commas before converting to float.
# Line-anchored patterns ((?m)^\s*...) prevent partial matches on compound names.
# Order matters: more specific patterns before ambiguous ones.

PATTERNS = [
    # ── Chemistry / CMP ─────────────────────────────────────────────────────
    (r'TOTAL PROTEIN\s+([<>]?[\d.,]+)',                  'total_protein'),
    (r'ALBUMIN\s+([<>]?[\d.,]+)',                        'albumin'),
    (r'GLOBULIN\s*\(Calc\.\)\s+([<>]?[\d.,]+)',          'globulin'),
    (r'A/G RATIO\s*\(Calc\.\)\s+([<>]?[\d.,]+)',         'ag_ratio'),
    (r'SGOT\s*\(AST\)\s+([<>]?[\d.,]+)',                 'ast'),
    (r'SGPT\s*\(ALT\)\s+([<>]?[\d.,]+)',                 'alt'),
    (r'ALKALINE PHOSPHATASE\s+([<>]?[\d.,]+)',            'alkaline_phosphatase'),
    (r'BILIRUBIN,\s*TOTAL\s+([<>]?[\d.,]+)',             'total_bilirubin'),
    (r'\bGLUCOSE\b\s+([<>]?[\d.,]+)',                   'glucose'),
    (r'\bCALCIUM\b\s+([<>]?[\d.,]+)',                   'calcium'),
    (r'\bCHLORIDE\b\s+([<>]?[\d.,]+)',                  'chloride'),
    (r'\bCO2\b\s+([<>]?[\d.,]+)',                       'co2'),
    (r'\bSODIUM\b\s+([<>]?[\d.,]+)',                    'sodium'),
    (r'\bPOTASSIUM\b\s+([<>]?[\d.,]+)',                 'potassium'),
    (r'ANION GAP\s*\(Calc\.\)\s+([<>]?[\d.,]+)',         'anion_gap'),
    (r'BUN/CREATININE\s*\(Calc\.\)\s+([<>]?[\d.,]+)',   'bun_creatinine_ratio'),  # before BUN
    (r'\bBUN\b\s+([<>]?[\d.,]+)',                       'bun'),
    (r'\bCREATININE\b\s+([<>]?[\d.,]+)',                'creatinine'),
    (r'e\.GFR\s*\(Calc\.\)\s+([<>]?[\d.,]+)',           'egfr'),

    # ── Cardiac Risk ─────────────────────────────────────────────────────────
    (r'(?m)^\s*CHOLESTEROL\b\s+([<>]?[\d.,]+)',         'total_cholesterol'),
    (r'(?m)^\s*HDL\b\s+([<>]?[\d.,]+)',                 'hdl_cholesterol'),
    (r'(?m)^\s*VLDL\b\s*(?:\(Calc\.\))?\s+([<>]?[\d.,]+)', 'vldl_cholesterol'),
    (r'(?m)^\s*LDL\b\s*(?:\(Calc\.\))?\s+([<>]?[\d.,]+)',  'ldl_cholesterol'),
    (r'\bTRIGLYCERIDES\b\s+([<>]?[\d.,]+)',             'triglycerides'),

    # ── CBC — MCHC before MCH to avoid partial match ─────────────────────────
    (r'\bWBC\b\s+([<>]?[\d.,]+)',                       'wbc'),
    (r'\bRBC\b\s+([<>]?[\d.,]+)',                       'rbc'),
    (r'\bHGB\b\s+([<>]?[\d.,]+)',                       'hemoglobin'),
    (r'\bHCT\b\s+([<>]?[\d.,]+)',                       'hematocrit'),
    (r'\bMCV\b\s+([<>]?[\d.,]+)',                       'mcv'),
    (r'\bMCHC\b\s+([<>]?[\d.,]+)',                      'mchc'),
    (r'\bMCH\b\s+([<>]?[\d.,]+)',                       'mch'),
    (r'\bRDW\b\s+([<>]?[\d.,]+)',                       'rdw'),
    (r'\bPLATELETS\b\s+([<>]?[\d.,]+)',                 'platelets'),
    (r'\bMPV\b\s+([<>]?[\d.,]+)',                       'mpv'),
    (r'NEUTROPHILS\s*%\s+([<>]?[\d.,]+)',               'neutrophils_percent'),
    (r'LYMPHOCYTES\s*%\s+([<>]?[\d.,]+)',               'lymphocytes_percent'),
    (r'MONOCYTES\s*%\s+([<>]?[\d.,]+)',                 'monocytes_percent'),
    (r'EOSINOPHILS\s*%\s+([<>]?[\d.,]+)',               'eosinophils_percent'),
    (r'BASOPHILS\s*%\s+([<>]?[\d.,]+)',                 'basophils_percent'),

    # ── Thyroid ───────────────────────────────────────────────────────────────
    (r'TSH\s*\(?3rd\s+GENERATION\)?\s+([<>]?[\d.,]+)', 'tsh'),
    (r'TOTAL\s+T4\s+([<>]?[\d.,]+)',                    'total_t4'),
    (r'FREE\s+T3\s+([<>]?[\d.,]+)',                     'free_t3'),
    (r'FREE\s+T4\s+([<>]?[\d.,]+)',                     'free_t4'),
    (r'THYROID\s+PEROXIDASE\s+AB\.?\s+([<>]?[\d.,]+)', 'tpo_antibody'),

    # ── Vitamins ──────────────────────────────────────────────────────────────
    (r'VITAMIN\s+D,\s*25-HYDROXY\s+([<>]?[\d.,]+)',    'vitamin_d'),
    (r'VITAMIN\s+B-12\s+([<>]?[\d.,]+)',               'vitamin_b12'),

    # ── Anemia Profile ────────────────────────────────────────────────────────
    (r'SERUM\s+IRON\s+([<>]?[\d.,]+)',                 'iron'),
    (r'\bTIBC\b\s+([<>]?[\d.,]+)',                     'tibc'),
    (r'%?IRON\s+SATURATION\s+([<>]?[\d.,]+)',          'iron_saturation'),

    # ── Special Chemistry ─────────────────────────────────────────────────────
    (r'\bHGBA1C\b\s+([<>]?[\d.,]+)',                   'hemoglobin_a1c'),
    (r'GROWTH\s+HORMONE\s*\(?GH\)?\s+([<>]?[\d.,]+)', 'growth_hormone'),
    (r'INSULIN,?\s+FASTING\s+([<>]?[\d.,]+)',          'fasting_insulin'),

    # ── Sed Rate ──────────────────────────────────────────────────────────────
    (r'SED\s+RATE\s+([<>]?[\d.,]+)',                   'esr'),

    # ── Hormonal ──────────────────────────────────────────────────────────────
    (r'\bESTRADIOL\b\s+([<>]?[\d.,]+)',                'estradiol'),
    (r'\bFSH\b\s+([<>]?[\d.,]+)',                      'fsh'),
    (r'\bLH\b\s+([<>]?[\d.,]+)',                       'lh'),
    (r'SEX\s+HORMONE\s+BNDG\.?\s+GLOBULIN\s+([<>]?[\d.,]+)', 'shbg'),
    (r'TESTOSTERONE,\s*TOTAL\s+([<>]?[\d.,]+)',        'total_testosterone'),
    (r'TESTOSTERONE,\s*FREE\s+([<>]?[\d.,]+)',         'free_testosterone'),

    # ── Tumor Markers ─────────────────────────────────────────────────────────
    (r'PSA,\s*Total\s+([<>]?[\d.,]+)',                 'psa_total'),
]


# ── Text extraction ───────────────────────────────────────────────────────────

def extract_pages(pdf_path):
    """Return list of (page_index, page_text) for every page in the PDF."""
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            pages.append((i, page.extract_text() or ''))
    return pages


def split_into_sections(pages):
    """
    Split pages into per-patient sections based on 'END OF REPORT' markers.
    Returns list of dicts: {text, page_indices}.
    """
    sections = []
    current_text = ''
    current_indices = []

    for page_num, text in pages:
        current_text += text + '\n'
        current_indices.append(page_num)
        if re.search(r'END\s+OF\s+REPORT', text, re.IGNORECASE):
            sections.append({'text': current_text.strip(), 'pages': list(current_indices)})
            current_text = ''
            current_indices = []

    # Trailing pages after last END OF REPORT (usually empty footer)
    if current_text.strip() and current_indices:
        sections.append({'text': current_text.strip(), 'pages': list(current_indices)})

    return sections


# ── Header & value parsing ────────────────────────────────────────────────────

def parse_header(text):
    """Extract patient name, DOB, and collection date from a report section."""
    result = {}

    # Patient name — "LASTNAME, FIRSTNAME  AGE  SEX"
    # Unicode curly apostrophe (U+2019) handled in last_name (e.g., O'BRIEN)
    m = re.search(r'^([A-Z][A-Z\'\u2019\-]+,\s+[A-Z]+)\s+\d+\s+[MF]\b', text, re.MULTILINE)
    if m:
        parts = m.group(1).split(',')
        result['last_name'] = parts[0].strip().title().replace('\u2019', "'")
        result['first_name'] = parts[1].strip().title().replace('\u2019', "'")

    # DOB — "DOB: M/D/YYYY" or "DOB: M/D/YY"
    m = re.search(r'DOB:\s*(\d{1,2}/\d{1,2}/\d{2,4})', text)
    if m:
        result['dob'] = _parse_date(m.group(1))

    # Collection date — 10+ digit patient ID followed by time and date
    m = re.search(r'\d{10,}\s+[\d:]+\s+(\d{1,2}/\d{1,2}/\d{2,4})', text)
    if m:
        result['test_date'] = _parse_date(m.group(1))

    return result


def _parse_date(date_str):
    """Convert M/D/YY or M/D/YYYY to YYYY-MM-DD."""
    parts = date_str.split('/')
    month, day, year = int(parts[0]), int(parts[1]), int(parts[2])
    if year < 100:
        year += 2000
    return f"{year:04d}-{month:02d}-{day:02d}"


def parse_values(text):
    """
    Extract numeric lab values using regex patterns.
    Handles out-of-range prefixes (<, >) and comma-separated numbers (1,500).
    """
    values = {}
    for pattern, col in PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if m:
            try:
                raw = re.sub(r'[<>,\s]', '', m.group(1))
                values[col] = float(raw)
            except ValueError:
                pass
    return values


# ── PDF split & upload ────────────────────────────────────────────────────────

def extract_patient_pdf(src_path, page_indices, out_path):
    """Extract specific pages from a PDF and write to out_path."""
    reader = PdfReader(str(src_path))
    writer = PdfWriter()
    for idx in page_indices:
        if idx < len(reader.pages):
            writer.add_page(reader.pages[idx])
    with open(out_path, 'wb') as f:
        writer.write(f)


def get_public_url(storage_path):
    """Return the public URL for a Supabase Storage path (no upload needed)."""
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{storage_path}"


# ── SQL generation ────────────────────────────────────────────────────────────

def generate_sql(records):
    """
    Generate SQL UPDATE + INSERT pairs for all parsed records.
    UPDATE: fills any existing row (stub or partial) for patient+provider+date.
    INSERT: creates a new row only if none exists yet.
    pdf_url is included when available.
    """
    lines = [
        "-- ============================================================",
        "-- Primex Lab Import",
        "-- Generated by primex_parser.py",
        "-- ============================================================",
        "",
    ]

    processed = 0
    skipped = 0

    for rec in records:
        header = rec['header']
        vals = rec['values']
        fname = rec['filename']
        pdf_url = rec.get('pdf_url')

        if 'last_name' not in header or 'test_date' not in header:
            lines.append(f"-- SKIPPED (could not parse header): {fname}")
            lines.append("")
            skipped += 1
            continue

        # SQL-escape single quotes in names
        first = header['first_name'].replace("'", "''")
        last = header['last_name'].replace("'", "''")
        test_date = header['test_date']

        lines.append(f"-- {header['first_name']} {header['last_name']} | {test_date} | {len(vals)} values | {fname}")

        sorted_vals = sorted(vals.items())

        # ── UPDATE existing row ──────────────────────────────────────────────
        set_clauses = ', '.join(f"{col} = {val}" for col, val in sorted_vals)
        set_clauses += ", lab_type = 'historical', status = 'completed'"
        if pdf_url:
            set_clauses += f", pdf_url = '{pdf_url}'"

        update_sql = f"""UPDATE labs SET {set_clauses}
WHERE patient_id = (
    SELECT id FROM patients
    WHERE LOWER(last_name) = LOWER('{last}')
      AND LOWER(first_name) = LOWER('{first}')
    LIMIT 1
  )
  AND lab_provider = 'Primex'
  AND test_date = '{test_date}';"""

        # ── INSERT if no row exists ──────────────────────────────────────────
        cols = ['patient_id', 'lab_provider', 'lab_type', 'status', 'test_date', 'completed_date']
        vals_sql = [
            "p.id", "'Primex'", "'historical'", "'completed'",
            f"'{test_date}'", f"'{test_date}'",
        ]
        if pdf_url:
            cols.append('pdf_url')
            vals_sql.append(f"'{pdf_url}'")
        for col, val in sorted_vals:
            cols.append(col)
            vals_sql.append(str(val))

        insert_sql = f"""INSERT INTO labs ({', '.join(cols)})
SELECT {', '.join(vals_sql)}
FROM patients p
WHERE LOWER(p.last_name) = LOWER('{last}')
  AND LOWER(p.first_name) = LOWER('{first}')
  AND NOT EXISTS (
    SELECT 1 FROM labs l
    WHERE l.patient_id = p.id
      AND l.lab_provider = 'Primex'
      AND l.test_date = '{test_date}'
  )
LIMIT 1;"""

        lines.append(update_sql)
        lines.append(insert_sql)
        lines.append("")
        processed += 1

    lines.append(f"-- Summary: {processed} records generated, {skipped} skipped")
    return '\n'.join(lines), processed, skipped


# ── Main ──────────────────────────────────────────────────────────────────────

def process_pdf(pdf_path, tmp_dir):
    """
    Parse a PDF (single or combined), extract per-patient sub-PDFs,
    upload them, and return a list of record dicts for generate_sql().
    """
    print(f"Parsing: {pdf_path.name}")
    pages = extract_pages(pdf_path)
    sections = split_into_sections(pages)

    # Filter sections that have actual patient content
    valid_sections = [s for s in sections if s['text'].strip() and
                      re.search(r'DOB:', s['text'])]

    if len(valid_sections) > 1:
        print(f"  → {len(valid_sections)} patient reports in combined PDF")

    records = []
    for i, section in enumerate(valid_sections):
        header = parse_header(section['text'])
        values = parse_values(section['text'])

        label = f"{pdf_path.name}[{i+1}]" if len(valid_sections) > 1 else pdf_path.name
        name = f"{header.get('first_name', '?')} {header.get('last_name', '?')}"
        date = header.get('test_date', '?')

        # Extract individual patient PDF and save to tmp_dir for later upload
        pdf_url = None
        if header.get('last_name') and header.get('test_date'):
            safe_last = re.sub(r"[^a-zA-Z0-9]", "_", header['last_name'])
            safe_first = re.sub(r"[^a-zA-Z0-9]", "_", header.get('first_name', 'unknown'))
            pdf_filename = f"{safe_last}_{safe_first}_{header['test_date']}.pdf"
            storage_path = f"{STORAGE_PREFIX}/{pdf_filename}"
            out_pdf = tmp_dir / pdf_filename

            extract_patient_pdf(pdf_path, section['pages'], out_pdf)
            pdf_url = get_public_url(storage_path)
            print(f"  → {name} | {date} | {len(values)} values | PDF saved: {pdf_filename}")
        else:
            print(f"  → {name} | {date} | {len(values)} values | {label}")

        records.append({
            'filename': label,
            'header': header,
            'values': values,
            'pdf_url': pdf_url,
        })

    return records


def main():
    folder = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/sessions/dazzling-happy-hopper/mnt/uploads')
    pdf_files = sorted(folder.glob('*.pdf'))

    if not pdf_files:
        print(f"No PDFs found in {folder}")
        return

    print(f"Found {len(pdf_files)} PDF(s) in {folder}")
    if SUPABASE_URL and SUPABASE_KEY:
        print(f"Supabase Storage: {STORAGE_BUCKET}/{STORAGE_PREFIX}/")
    else:
        print("⚠ No Supabase credentials — PDF upload disabled")
    print()

    # Save split PDFs to workspace folder so the uploader script can find them
    workspace = Path('/sessions/dazzling-happy-hopper/mnt/Claude CUPP 2nd brain/Range Medical CRM/rangemedical-system-2/primex-pdfs')
    tmp_dir = workspace
    tmp_dir.mkdir(exist_ok=True)

    all_records = []
    for pdf_path in pdf_files:
        try:
            recs = process_pdf(pdf_path, tmp_dir)
            all_records.extend(recs)
        except Exception as e:
            print(f"  ERROR: {e}")
            import traceback
            traceback.print_exc()
            all_records.append({'filename': pdf_path.name, 'header': {}, 'values': {}, 'pdf_url': None})

    print()
    out_path = Path('/tmp/primex_import.sql')
    sql, inserted, skipped = generate_sql(all_records)
    out_path.write_text(sql)

    print(f"SQL written to: {out_path}")
    print(f"Records ready:  {inserted}")
    print(f"Skipped:        {skipped}")


if __name__ == '__main__':
    main()
