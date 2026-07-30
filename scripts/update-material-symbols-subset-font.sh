#!/usr/bin/env bash
set -euox pipefail

icons=()

# Alphabetical order!
icons+=("drag_indicator")
icons+=("home")
icons+=("keyboard_arrow_down")
icons+=("keyboard_arrow_up")
icons+=("link")
icons+=("link_off")
icons+=("settings")
icons+=("visibility")
icons+=("visibility_off")

icons_string=$(IFS=,; echo "${icons[*]}")

css_url="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:FILL,GRAD,opsz@0..1,-25..200,20..48&icon_names=${icons_string}&display=block"
# Spoof a font-variation-supporting user agent
user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv125.0) Gecko/20100101 Firefox/125.0"

font_url=$(
  curl -A "$user_agent" -s "$css_url" |
  sed -nE 's/.*url\(([^)]*)\).*/\1/p' |
  head -n1 |
  tr -d '"'\'' '
)

curl -L "$font_url" -o ./static/fonts/material-symbols-sharp.subset.woff2
