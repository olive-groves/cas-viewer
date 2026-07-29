#!/usr/bin/env bash
set -euox pipefail

icons=()

# Alphabetical order!
icons+=("home")
icons+=("keyboard_arrow_down")
icons+=("keyboard_arrow_up")
icons+=("link")
icons+=("link_off")
icons+=("settings")

icons_string=$(IFS=,; echo "${icons[*]}")

css_url="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:FILL@0..1&icon_names=${icons_string}&display=block"

font_url=$(
  curl -s "$css_url" |
  sed -nE 's/.*url\(([^)]*)\).*/\1/p' |
  head -n1 |
  tr -d '"'\'' '
)

curl -L "$font_url" > ./static/fonts/material-symbols-sharp.subset.woff2
