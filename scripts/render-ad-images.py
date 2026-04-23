#!/usr/bin/env python3
"""Render Range Medical v2 free-session ads deterministically with PIL (no AI).
Pixel-perfect 1080x1080 typographic ads, zero typos."""

import os
import pathlib
import subprocess
import sys
import urllib.request

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Installing Pillow...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--quiet", "Pillow"])
    from PIL import Image, ImageDraw, ImageFont

SIZE = 1080
PAD = 80  # safe-zone padding from edges (larger than 60 IG safe-zone)

BG = (26, 26, 26)           # #1a1a1a
WHITE = (255, 255, 255)
LABEL = (160, 160, 160)     # #a0a0a0
RULE = (64, 64, 64)          # #404040
BULLET_GRAY = (128, 128, 128)  # #808080

FONTS_DIR = pathlib.Path(__file__).parent / ".fonts"
FONTS_DIR.mkdir(exist_ok=True)
INTER_PATH = FONTS_DIR / "Inter.ttf"
INTER_URL = "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf"

def ensure_fonts():
    if INTER_PATH.exists() and INTER_PATH.stat().st_size > 100_000:
        return
    print(f"  downloading Inter variable font...")
    with urllib.request.urlopen(INTER_URL, timeout=60) as r:
        INTER_PATH.write_bytes(r.read())

def font(weight, size):
    """Load Inter variable font at the requested weight (100-900)."""
    f = ImageFont.truetype(str(INTER_PATH), size=size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        # fallback — try by name
        try:
            names = {100: 'Thin', 300: 'Light', 400: 'Regular', 500: 'Medium',
                     600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black'}
            f.set_variation_by_name(names.get(weight, 'Regular').encode())
        except Exception:
            pass
    return f

def draw_tracked_text(draw, pos, text, font_obj, fill, tracking_em):
    """Draw uppercase text with manual letter-spacing (Pillow doesn't support it natively).
    tracking_em is fraction of font size added between letters."""
    x, y = pos
    extra = int(font_obj.size * tracking_em)
    for ch in text:
        draw.text((x, y), ch, font=font_obj, fill=fill)
        bbox = draw.textbbox((0, 0), ch, font=font_obj)
        ch_w = bbox[2] - bbox[0]
        x += ch_w + extra
    return x  # final x after text

def measure_tracked(draw, text, font_obj, tracking_em):
    """Width using PIL's advance-based textlength plus tracking extra between chars."""
    extra = int(font_obj.size * tracking_em)
    base = draw.textlength(text, font=font_obj)
    return int(base + extra * max(0, len(text) - 1))

def measure_plain(draw, text, font_obj):
    return int(draw.textlength(text, font=font_obj))

def wrap_headline(draw, text, font_obj, max_width):
    """Greedy word-wrap using advance-based width (matches draw.text output)."""
    words = text.split(" ")
    lines = []
    line = []
    for w in words:
        trial = line + [w]
        trial_text = " ".join(trial)
        if measure_plain(draw, trial_text, font_obj) <= max_width:
            line = trial
        else:
            if line:
                lines.append(" ".join(line))
            line = [w]
    if line:
        lines.append(" ".join(line))
    return lines

def draw_headline(draw, lines, font_obj, start_y, tracking_em, leading_factor=0.95):
    """Draw each line with simulated negative tracking. Returns y after last line."""
    # Use ascent/descent for consistent line height
    ascent, descent = font_obj.getmetrics()
    line_h = int((ascent + descent) * leading_factor)
    y = start_y
    for line in lines:
        # Negative tracking (-0.03em) — draw word-by-word using textlength with slight compression
        # Pillow can't do negative tracking per-char, so we accept default kerning which is close enough for Inter Black.
        draw.text((PAD, y), line, font=font_obj, fill=WHITE)
        y += line_h
    return y

def render_ad(headline: str, eyebrow: str, cta: str, out_path: pathlib.Path):
    img = Image.new("RGB", (SIZE, SIZE), BG)
    draw = ImageDraw.Draw(img)

    # --- Eyebrow (top) ---
    eyebrow_font = font(800, 22)
    # Small gray square bullet
    bullet_size = 14
    draw.rectangle(
        [PAD, PAD, PAD + bullet_size, PAD + bullet_size],
        fill=BULLET_GRAY,
    )
    draw_tracked_text(
        draw,
        (PAD + bullet_size + 14, PAD - 2),
        eyebrow.upper(),
        eyebrow_font,
        LABEL,
        tracking_em=0.14,
    )

    # --- Headline (middle, left-aligned, large) ---
    # Try a few sizes until it fits within 2-3 lines
    max_width = SIZE - 2 * PAD
    lines = None
    chosen_font = None
    for size in (148, 136, 124, 112, 100, 90, 80):
        f = font(900, size)
        trial_lines = wrap_headline(draw, headline.upper(), f, max_width)
        if len(trial_lines) <= 3 and all(
            measure_plain(draw, ln, f) <= max_width for ln in trial_lines
        ):
            lines = trial_lines
            chosen_font = f
            break
    if lines is None:
        chosen_font = font(900, 80)
        lines = wrap_headline(draw, headline.upper(), chosen_font, max_width)

    # Vertically place headline block so it sits in the middle-upper area
    ascent, descent = chosen_font.getmetrics()
    line_h = int((ascent + descent) * 0.92)
    block_h = line_h * len(lines)
    # Center the block slightly above the horizontal middle
    start_y = (SIZE - block_h) // 2 - 40
    y = start_y
    for ln in lines:
        draw.text((PAD, y), ln.upper(), font=chosen_font, fill=WHITE)
        y += line_h

    # --- Thin rule below headline ---
    rule_y = y + 40
    draw.rectangle([PAD, rule_y, SIZE - PAD, rule_y + 1], fill=RULE)

    # --- CTA bottom-left + wordmark bottom-right ---
    cta_font = font(800, 24)
    wordmark_font = font(800, 24)

    cta_y = SIZE - PAD - 24
    draw_tracked_text(
        draw,
        (PAD, cta_y),
        cta.upper(),
        cta_font,
        WHITE,
        tracking_em=0.12,
    )

    # Wordmark — measured width then right-aligned
    wm_text = "RANGE MEDICAL"
    wm_w = measure_tracked(draw, wm_text, wordmark_font, 0.15)
    draw_tracked_text(
        draw,
        (SIZE - PAD - wm_w, cta_y),
        wm_text,
        wordmark_font,
        WHITE,
        tracking_em=0.15,
    )

    img.save(out_path, "PNG", optimize=True)
    return out_path

ADS = [
    # HBOT
    {"filename": "hbot-1-brain-fog.png",     "headline": "Brain fog that won't lift?",         "eyebrow": "Hyperbaric Oxygen · Newport Beach", "cta": "Try a Hyperbaric Oxygen Session on Us"},
    {"filename": "hbot-2-bounce-back.png",   "headline": "Slow to bounce back?",               "eyebrow": "Hyperbaric Oxygen · Newport Beach", "cta": "Try a Hyperbaric Oxygen Session on Us"},
    {"filename": "hbot-3-headaches.png",     "headline": "Persistent headaches?",              "eyebrow": "Hyperbaric Oxygen · Newport Beach", "cta": "Try a Hyperbaric Oxygen Session on Us"},
    {"filename": "hbot-4-inflammation.png",  "headline": "Inflammation that won't quit?",      "eyebrow": "Hyperbaric Oxygen · Newport Beach", "cta": "Try a Hyperbaric Oxygen Session on Us"},
    {"filename": "hbot-5-3pm-crash.png",     "headline": "Running on empty by 3pm?",           "eyebrow": "Hyperbaric Oxygen · Newport Beach", "cta": "Try a Hyperbaric Oxygen Session on Us"},
    # RLT
    {"filename": "rlt-1-skin.png",           "headline": "Skin not bouncing back?",            "eyebrow": "Red Light Therapy · Newport Beach", "cta": "Try a Red Light Therapy Session on Us"},
    {"filename": "rlt-2-scars-redness.png",  "headline": "Scars, stretch marks, redness?",     "eyebrow": "Red Light Therapy · Newport Beach", "cta": "Try a Red Light Therapy Session on Us"},
    {"filename": "rlt-3-joint-pain.png",     "headline": "Chronic joint or muscle pain?",      "eyebrow": "Red Light Therapy · Newport Beach", "cta": "Try a Red Light Therapy Session on Us"},
    {"filename": "rlt-4-recovery.png",       "headline": "Sore after every workout?",          "eyebrow": "Red Light Therapy · Newport Beach", "cta": "Try a Red Light Therapy Session on Us"},
    {"filename": "rlt-5-stress-sleep.png",   "headline": "Stressed and sleeping poorly?",      "eyebrow": "Red Light Therapy · Newport Beach", "cta": "Try a Red Light Therapy Session on Us"},
]

def main():
    ensure_fonts()
    out_dir = pathlib.Path("public/ads/free-session")
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"Rendering {len(ADS)} ads to {out_dir}...")
    for ad in ADS:
        p = out_dir / ad["filename"]
        render_ad(ad["headline"], ad["eyebrow"], ad["cta"], p)
        print(f"  wrote {p} ({p.stat().st_size // 1024} KB)")
    print("Done.")

if __name__ == "__main__":
    main()
