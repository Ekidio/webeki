#!/bin/zsh
# Elkészíti a kiadás ZIP-jét: dist/WEBEKI-<verzió>.zip (a verzió a js/app.js VERSION értéke).
set -euo pipefail
cd "$(dirname "$0")"

VERSION=$(sed -n "s/^const VERSION = '\(.*\)';/\1/p" js/app.js)
[[ -n "$VERSION" ]] || { echo "✗ Nem találom a VERSION értéket a js/app.js-ben."; exit 1; }
grep -q "app.js?v=$VERSION\"" index.html && grep -q "app.js?v=$VERSION\"" mobil/index.html || { echo "✗ Az index.html ?v= jelei nem egyeznek a verzióval ($VERSION) – írd át őket."; exit 1; }
NAME="WEBEKI-$VERSION"
OUT="dist/$NAME"

rm -rf "$OUT" "dist/$NAME.zip"
mkdir -p "$OUT"
cp -R index.html css js mobil README.md LICENSE "$OUT/"
(cd dist && zip -qrX "$NAME.zip" "$NAME" -x '*.DS_Store')
rm -rf "$OUT"

cat <<MSG

✓ Kiadás előkészítve: dist/$NAME.zip

Feltöltés a GitHubra:
  gh release create v$VERSION dist/$NAME.zip --title "WEBEKI $VERSION"
vagy kézzel: https://github.com/Ekidio/webeki/releases/new  (Tag: v$VERSION, húzd be a ZIP-et)
MSG
