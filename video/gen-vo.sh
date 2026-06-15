#!/usr/bin/env bash
# Generate Regent demo voiceover with macOS `say` (Daniel, UK — measured/regal).
# AIFF -> WAV via afconvert; duration via afinfo; emits public/vo/manifest.json.
set -euo pipefail

cd "$(dirname "$0")"
VOICE="Daniel"
RATE=152
FPS=30
HOLD=20          # extra frames held after narration ends (~0.66s)
LEAD=8           # frames before narration starts (~0.27s)
OUT="public/vo"
mkdir -p "$OUT"

# Scene id and narration text. Keep in sync with src/scenes/*.
ids=(s1 s2 s3 s4 s5 s6 s7 s8)
texts=(
"You spot the perfect trade. The price is right. The moment is now. But you are asleep. Or in a meeting. Or simply unwilling to watch a screen for six hours."
"So you are left with two bad choices. Miss the opportunity entirely. Or hand your private key to an automation script, and pray it never goes rogue. Paralysis, or custody. Neither is acceptable."
"Regent is a third way. An A.I. agent that acts on your behalf, inside hard, signed boundaries. You give the mandate. Regent executes. Never beyond."
"A mandate is a deed you sign with your own wallet. Four clauses. A goal. A budget ceiling. A maximum slippage. And an expiry. The agent acts freely within these limits, and the instant a boundary would break, it stops. Your keys never leave your wallet."
"Every boundary is enforced three independent times. First, in the interface, before anything is sent. Second, in the agent, which re-validates every decision. And third, on chain. The Regent Mandate contract reverts any transaction that exceeds your signature. A bug, or a breach, in any single layer can never move your funds beyond the mandate."
"Activate Regent, and watch it work. It scans routes across Aerodrome, Uniswap, Sushiswap and Baseswap. Venice A.I. weighs each one against your mandate. The best route within bounds is executed through the One Shot relayer, gas abstracted, no native funds required. And every decision is written to an auditable trail."
"And when no route fits, when the price has moved, or the budget is spent, Regent refuses. And it tells you exactly why. Restraint is the product. The mandate is law."
"Built on MetaMask Smart Accounts, Venice A.I., and One Shot, on Base Sepolia. Regent. You give the mandate. Regent executes."
)

echo "[" > "$OUT/manifest.json"
n=${#ids[@]}
for i in "${!ids[@]}"; do
  id="${ids[$i]}"
  text="${texts[$i]}"
  aiff="/tmp/regent_${id}.aiff"
  wav="$OUT/${id}.wav"

  echo "  -> $id : say"
  say -v "$VOICE" -r "$RATE" -o "$aiff" "$text"
  afconvert -f WAVE -d LEI16@44100 "$aiff" "$wav"

  dur=$(afinfo "$wav" 2>/dev/null | awk -F': ' '/estimated duration/ {print $2}' | awk '{print $1}')
  # frames = lead + ceil(dur*fps) + hold
  frames=$(awk -v d="$dur" -v f="$FPS" -v lead="$LEAD" -v hold="$HOLD" \
    'BEGIN { printf "%d", lead + int(d*f) + (d*f > int(d*f) ? 1 : 0) + hold }')

  # JSON-escape the narration text for captions
  esc=$(printf '%s' "$text" | sed 's/\\/\\\\/g; s/"/\\"/g')

  comma=","; [ "$i" -eq "$((n-1))" ] && comma=""
  {
    printf '  { "id": "%s", "file": "vo/%s.wav", "durationInFrames": %s, "lead": %s, "seconds": %s, "text": "%s" }%s\n' \
      "$id" "$id" "$frames" "$LEAD" "$dur" "$esc" "$comma"
  } >> "$OUT/manifest.json"

  echo "     dur=${dur}s frames=${frames}"
done
echo "]" >> "$OUT/manifest.json"

echo "=== manifest ==="
cat "$OUT/manifest.json"
total=$(awk -F'"durationInFrames": ' '/durationInFrames/ {split($2,a,","); s+=a[1]} END {print s}' "$OUT/manifest.json")
echo "TOTAL FRAMES: $total  (~$(awk -v t="$total" 'BEGIN{printf "%.1f", t/30}')s)"
