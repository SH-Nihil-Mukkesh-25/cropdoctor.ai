set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"


if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:?Missing EXPO_PUBLIC_SUPABASE_URL in .env}"
SUPABASE_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY:?Missing EXPO_PUBLIC_SUPABASE_ANON_KEY in .env}"

echo "CropGuard Database Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Supabase URL: $SUPABASE_URL"
echo ""

run_sql() {
  local sql="$1"
  local response
  response=$(curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$sql\"}" \
    2>&1) || true
  echo "$response"
}


create_user() {
  local email="$1"
  local password="$2"
  local name="$3"

  echo -n "  Creating user: $email ... "

  local response
  response=$(curl -s -X POST \
    "${SUPABASE_URL}/auth/v1/signup" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$email\",
      \"password\": \"$password\",
      \"data\": { \"name\": \"$name\" }
    }")

  local user_id
  user_id=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id') or d.get('user',{}).get('id',''))" 2>/dev/null || echo "")

  if [ -n "$user_id" ] && [ "$user_id" != "" ]; then
    echo "(id: $user_id)"
    echo "$user_id"
  else
    local err_msg
    err_msg=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('msg','unknown error'))" 2>/dev/null || echo "unknown")
    echo "$err_msg"
    echo ""
  fi
}
insert_scan() {
  local user_id="$1"
  local disease="$2"
  local confidence="$3"
  local recommendation="$4"
  local image_uri="$5"

  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/scan_history" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{
      \"user_id\": \"$user_id\",
      \"disease\": \"$disease\",
      \"confidence\": $confidence,
      \"recommendation\": \"$recommendation\",
      \"image_uri\": \"$image_uri\"
    }" > /dev/null 2>&1
}

echo "Step 1: Applying schema..."
echo "   Please run supabase/schema.sql manually in the"
echo "      Supabase Dashboard → SQL Editor."
echo "      (The REST API doesn't support DDL statements.)"
echo ""
echo "   Open: ${SUPABASE_URL//.supabase.co/.supabase.co}/project/default/sql"
echo ""
read -p "   Press Enter after you've run schema.sql... " _

echo ""
echo "Step 2: Creating default test users..."

USER1_ID=$(create_user "farmer1@cropguard.app" "farmer123" "Ravi Kumar" | tail -1)
USER2_ID=$(create_user "farmer2@cropguard.app" "farmer123" "Priya Devi" | tail -1)
USER3_ID=$(create_user "admin@cropguard.app"   "admin123"  "Admin"      | tail -1)

echo ""

echo "Step 3: Seeding sample scan history..."

if [ -n "$USER1_ID" ]; then
  echo "  Seeding scans for farmer1..."
  insert_scan "$USER1_ID" \
    "Tomato - Late Blight" \
    0.92 \
    "Remove and destroy infected plants immediately. Apply copper-based fungicide every 7-10 days. Improve air circulation by pruning." \
    "https://images.unsplash.com/photo-1592921870789-04563d55041c?w=400"

  insert_scan "$USER1_ID" \
    "Potato - Early Blight" \
    0.84 \
    "Apply chlorothalonil or mancozeb fungicide at first symptoms. Remove infected plant debris after harvest. Practice crop rotation." \
    "https://images.unsplash.com/photo-1518977676601-b53f82ber6f7?w=400"

  insert_scan "$USER1_ID" \
    "Corn (maize) - Common Rust" \
    0.78 \
    "Apply foliar fungicides like azoxystrobin at first sign of pustules. Plant resistant hybrids in future seasons." \
    "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400"

  echo "  3 scans seeded for farmer1"
fi

if [ -n "$USER2_ID" ]; then
  echo "  Seeding scans for farmer2..."
  insert_scan "$USER2_ID" \
    "Apple - Apple Scab" \
    0.87 \
    "Remove fallen leaves to reduce spore sources. Apply fungicide sprays during spring. Prune trees for better air circulation." \
    "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400"

  insert_scan "$USER2_ID" \
    "Grape - Healthy" \
    0.95 \
    "The plant appears to be healthy. No treatment is necessary. Continue regular monitoring and care." \
    "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400"

  echo "  2 scans seeded for farmer2"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Database setup complete!"
echo ""
echo "Default test accounts:"
echo "  farmer1@cropguard.app / farmer123"
echo "  farmer2@cropguard.app / farmer123"
echo "  admin@cropguard.app   / admin123"
echo ""
echo "You can now start the app with: npx expo start --web"
