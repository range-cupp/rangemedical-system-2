#!/bin/bash
# Timezone Safety Check — Range Medical
# Catches the most dangerous UTC date patterns that cause wrong dates.
# Run: npm run check:tz
#
# Only flags new Date() (no arguments = "right now" in UTC).
# Does NOT flag computed dates like nextDate.toISOString() — those are lower risk.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo "${BOLD}Timezone Safety Check${NC}"
echo "Scanning for 'new Date()' UTC patterns that should use Pacific Time..."
echo ""

ERRORS=0

# Pattern: new Date().toISOString().split('T')[0]
# This gets "today" in UTC — wrong after 5pm Pacific
MATCHES=$(grep -rn "new Date()\.toISOString()\.split" \
  --include="*.js" --include="*.jsx" \
  pages/ components/ lib/ \
  2>/dev/null \
  | grep -v node_modules \
  | grep -v '.next/' \
  | grep -v 'command-center.js' \
  | grep -v 'RangeMedicalSystem.js' \
  | grep -v 'date-utils.js')

if [ -n "$MATCHES" ]; then
  COUNT=$(echo "$MATCHES" | wc -l | tr -d ' ')
  echo "${RED}FOUND $COUNT instance(s): new Date().toISOString().split('T')[0]${NC}"
  echo "Fix: Use new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })"
  echo "  or todayPacific() from lib/date-utils.js (server-side)"
  echo ""
  echo "$MATCHES"
  echo ""
  ERRORS=$((ERRORS + COUNT))
fi

# Pattern: note_date defaulting to new Date().toISOString()
MATCHES2=$(grep -rn "note_date.*new Date()\.toISOString()" \
  --include="*.js" \
  pages/api/ \
  2>/dev/null \
  | grep -v node_modules)

if [ -n "$MATCHES2" ]; then
  COUNT2=$(echo "$MATCHES2" | wc -l | tr -d ' ')
  echo "${RED}FOUND $COUNT2 instance(s): note_date using new Date().toISOString()${NC}"
  echo "Fix: Use nowPacificISO() from lib/date-utils.js"
  echo ""
  echo "$MATCHES2"
  echo ""
  ERRORS=$((ERRORS + COUNT2))
fi

if [ $ERRORS -eq 0 ]; then
  echo "${GREEN}${BOLD}All clear — no UTC date issues found.${NC}"
  echo ""
  exit 0
else
  echo "${YELLOW}${BOLD}Found $ERRORS potential UTC date issue(s).${NC}"
  echo "Range Medical is Pacific Time only. See lib/date-utils.js for helpers."
  echo ""
  exit 1
fi
