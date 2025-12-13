#!/usr/bin/env python3
"""
Update Peptide Info on Existing Protocols
Range Medical - Protocol Tracking System

This script:
1. Reads existing protocols from Supabase
2. Matches them back to original payment data
3. Detects peptides from original product names
4. Updates the protocols with peptide info

Run: python3 update-protocol-peptides.py
"""

import csv
import requests
from datetime import datetime, timedelta

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    print("⚠️  pandas not installed - Mangomint Excel will be skipped")

# ============================================================
# CONFIGURATION
# ============================================================

GHL_INVOICES_FILE = '/Users/chriscupp/Desktop/Range-Medical-invoice-list-Dec-11-2025-17-26-53.csv'
ZENOTI_PAYMENTS_FILE = '/Users/chriscupp/Desktop/Sales-Accrual.csv'
MANGOMINT_PAYMENTS_FILE = '/Users/chriscupp/Desktop/Payment Details.xlsx'

SUPABASE_URL = 'https://teivfptpozltpqwahgdl.supabase.co'
SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'

# ============================================================
# PEPTIDE DETECTION
# ============================================================

def detect_peptide_from_name(product_name):
    """Try to detect the peptide from the product name"""
    if not product_name:
        return None, None
    
    name = product_name.lower()
    
    primary = None
    secondary = None
    
    # BPC/TB combo
    if ('bpc' in name and 'tb' in name) or 'wolverine' in name:
        primary = 'BPC-157'
        secondary = 'TB-500'
    elif 'bpc' in name:
        primary = 'BPC-157'
    elif 'tb-500' in name or 'tb500' in name:
        primary = 'TB-500'
    
    # Metabolic
    if 'aod' in name:
        primary = 'AOD-9604'
    if 'mots' in name:
        primary = 'MOTS-C'
    
    # Longevity
    if 'epitalon' in name:
        primary = 'Epitalon'
    if 'ta-1' in name or 'ta1' in name or 'thymosin alpha' in name:
        primary = 'Thymosin Alpha-1'
    
    # Aesthetic
    if 'ghk' in name:
        primary = 'GHK-Cu'
    if 'glow' in name:
        primary = 'GHK-Cu'
        secondary = 'BPC-157'
    
    # KPV
    if 'kpv' in name:
        if primary:
            secondary = 'KPV'
        else:
            primary = 'KPV'
    
    # Default for generic "Peptide Therapy" or "Peptide Protocol" - assume BPC/TB
    if not primary and ('peptide therapy' in name or 'peptide protocol' in name or 'peptide week' in name):
        primary = 'BPC-157'
        secondary = 'TB-500'
    
    return primary, secondary


# ============================================================
# PEPTIDE KEYWORDS FOR FILTERING
# ============================================================

PEPTIDE_KEYWORDS = [
    'peptide', 'bpc', 'tb-500', 'tb500', 'aod', 'mots', 'ghk', 'ta-1', 'ta1',
    'epitalon', 'thymosin', 'wolverine', 'glow', 'recovery protocol',
    'metabolic protocol', 'longevity protocol', 'kpv'
]

def is_peptide_product(item_name):
    if not item_name:
        return False
    name_lower = str(item_name).lower()
    return any(kw in name_lower for kw in PEPTIDE_KEYWORDS)


# ============================================================
# LOAD PAYMENT DATA
# ============================================================

def load_all_payments():
    """Load all peptide payments from all sources"""
    payments = []
    
    # GHL
    try:
        with open(GHL_INVOICES_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                item = row.get('Line Item Name', '')
                if not is_peptide_product(item) or row.get('Status') != 'Paid':
                    continue
                
                amount_str = row.get('Line Item Amount', '0').replace('$', '').replace(',', '')
                try:
                    amount = float(amount_str)
                except:
                    amount = 0
                
                date_str = row.get('Issue Date', '')
                try:
                    date = datetime.strptime(date_str, '%b %d, %Y').strftime('%Y-%m-%d')
                except:
                    date = None
                
                name = row.get('Customer Name', '').strip().lower()
                
                payments.append({
                    'name': name,
                    'date': date,
                    'amount': amount,
                    'product': item,
                    'source': 'GHL'
                })
        print(f"  ✓ GHL: {len([p for p in payments if p['source'] == 'GHL'])} payments")
    except Exception as e:
        print(f"  ⚠️  GHL error: {e}")
    
    # Zenoti
    try:
        with open(ZENOTI_PAYMENTS_FILE, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                item = row.get('Item Name', '')
                if not is_peptide_product(item):
                    continue
                
                try:
                    amount = float(row.get('Collected', '0').replace(',', '') or 0)
                except:
                    amount = 0
                
                if amount <= 0:
                    continue
                
                date_str = row.get('Sale Date', '')
                try:
                    date = datetime.strptime(date_str, '%m/%d/%Y').strftime('%Y-%m-%d')
                except:
                    date = None
                
                name = row.get('Guest Name', '').strip().lower()
                
                payments.append({
                    'name': name,
                    'date': date,
                    'amount': amount,
                    'product': item,
                    'source': 'Zenoti'
                })
        print(f"  ✓ Zenoti: {len([p for p in payments if p['source'] == 'Zenoti'])} payments")
    except Exception as e:
        print(f"  ⚠️  Zenoti error: {e}")
    
    # Mangomint
    if HAS_PANDAS:
        try:
            df = pd.read_excel(MANGOMINT_PAYMENTS_FILE)
            for _, row in df.iterrows():
                services = str(row.get('Services', '')) if pd.notna(row.get('Services')) else ''
                products = str(row.get('Products', '')) if pd.notna(row.get('Products')) else ''
                item = (services + ' ' + products).strip()
                
                if not is_peptide_product(item):
                    continue
                
                try:
                    amount = float(row.get('Amount', 0) or 0)
                except:
                    amount = 0
                
                if amount <= 0:
                    continue
                
                date_str = str(row.get('Payment Date', ''))
                try:
                    date = datetime.strptime(date_str, '%B %d, %Y').strftime('%Y-%m-%d')
                except:
                    try:
                        date = pd.to_datetime(date_str).strftime('%Y-%m-%d')
                    except:
                        date = None
                
                name = str(row.get('Client', '')).strip().lower()
                
                payments.append({
                    'name': name,
                    'date': date,
                    'amount': amount,
                    'product': item,
                    'source': 'Mangomint'
                })
            print(f"  ✓ Mangomint: {len([p for p in payments if p['source'] == 'Mangomint'])} payments")
        except Exception as e:
            print(f"  ⚠️  Mangomint error: {e}")
    
    return payments


# ============================================================
# SUPABASE OPERATIONS
# ============================================================

def fetch_protocols():
    """Fetch all protocols from Supabase"""
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}'
    }
    
    url = f"{SUPABASE_URL}/rest/v1/protocols?select=*"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching protocols: {response.text}")
        return []


def update_protocol(protocol_id, primary_peptide, secondary_peptide):
    """Update a protocol with peptide info"""
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    
    url = f"{SUPABASE_URL}/rest/v1/protocols?id=eq.{protocol_id}"
    
    data = {
        'primary_peptide': primary_peptide,
        'updated_at': datetime.now().isoformat()
    }
    if secondary_peptide:
        data['secondary_peptide'] = secondary_peptide
    
    response = requests.patch(url, headers=headers, json=data)
    return response.status_code in [200, 204]


# ============================================================
# MATCHING LOGIC
# ============================================================

def normalize_name(name):
    """Normalize name for matching"""
    if not name:
        return ''
    return ' '.join(str(name).strip().split()).lower()


def find_payment_for_protocol(protocol, payments):
    """Find the original payment for a protocol"""
    p_name = normalize_name(protocol.get('patient_name', ''))
    p_date = protocol.get('start_date', '')
    p_amount = protocol.get('amount_paid', 0)
    
    best_match = None
    best_score = 0
    
    for payment in payments:
        score = 0
        
        # Name match
        pay_name = payment['name']
        if p_name == pay_name:
            score += 3
        elif p_name and pay_name and (p_name in pay_name or pay_name in p_name):
            score += 2
        elif p_name and pay_name:
            # Check last name match
            p_parts = p_name.split()
            pay_parts = pay_name.split()
            if p_parts and pay_parts and p_parts[-1] == pay_parts[-1]:
                score += 1
        
        # Date match (within 3 days)
        if p_date and payment['date']:
            try:
                p_dt = datetime.strptime(p_date, '%Y-%m-%d')
                pay_dt = datetime.strptime(payment['date'], '%Y-%m-%d')
                diff = abs((p_dt - pay_dt).days)
                if diff == 0:
                    score += 3
                elif diff <= 1:
                    score += 2
                elif diff <= 3:
                    score += 1
            except:
                pass
        
        # Amount match
        if p_amount and payment['amount']:
            if abs(p_amount - payment['amount']) < 1:
                score += 2
            elif abs(p_amount - payment['amount']) < 50:
                score += 1
        
        if score > best_score:
            best_score = score
            best_match = payment
    
    # Require at least name + one other match
    if best_score >= 3:
        return best_match
    return None


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 60)
    print("UPDATE PEPTIDE INFO ON EXISTING PROTOCOLS")
    print("=" * 60)
    
    # Load payments
    print("\n📂 Loading payment data...")
    payments = load_all_payments()
    print(f"   Total: {len(payments)} peptide payments")
    
    # Fetch protocols
    print("\n📋 Fetching protocols from Supabase...")
    protocols = fetch_protocols()
    print(f"   Found: {len(protocols)} protocols")
    
    # Find protocols needing peptide update
    needs_update = [p for p in protocols if not p.get('primary_peptide')]
    print(f"   Need peptide info: {len(needs_update)} protocols")
    
    if not needs_update:
        print("\n✅ All protocols already have peptide info!")
        return
    
    # Match and update
    print("\n🔄 Matching protocols to payments...")
    updated = 0
    not_found = 0
    
    for protocol in needs_update:
        payment = find_payment_for_protocol(protocol, payments)
        
        if payment:
            primary, secondary = detect_peptide_from_name(payment['product'])
            
            if primary:
                success = update_protocol(protocol['id'], primary, secondary)
                if success:
                    updated += 1
                    print(f"   ✓ {protocol['patient_name']}: {primary}" + (f" + {secondary}" if secondary else ""))
                else:
                    print(f"   ✗ Failed to update: {protocol['patient_name']}")
            else:
                # Default to BPC/TB for generic peptide products
                success = update_protocol(protocol['id'], 'BPC-157', 'TB-500')
                if success:
                    updated += 1
                    print(f"   ✓ {protocol['patient_name']}: BPC-157 + TB-500 (default)")
        else:
            not_found += 1
    
    print(f"\n📊 RESULTS")
    print(f"   Updated: {updated}")
    print(f"   Not matched: {not_found}")
    
    # For unmatched, apply default BPC/TB
    if not_found > 0:
        print(f"\n🔧 Applying default (BPC-157 + TB-500) to {not_found} unmatched protocols...")
        
        unmatched = [p for p in needs_update if not find_payment_for_protocol(p, payments)]
        for protocol in unmatched:
            success = update_protocol(protocol['id'], 'BPC-157', 'TB-500')
            if success:
                print(f"   ✓ {protocol['patient_name']}: BPC-157 + TB-500 (default)")
    
    print("\n✅ Done!")


if __name__ == '__main__':
    main()
