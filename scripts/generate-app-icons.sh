#!/usr/bin/env bash
# Generate iOS AppIcon + Android mipmap PNGs from assets/branding/icon-1024.png
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/assets/branding/icon-1024.png"
IOS_SET="$ROOT/ios/RallyApp/Images.xcassets/AppIcon.appiconset"
ANDROID_RES="$ROOT/android/app/src/main/res"

if [[ ! -f "$SRC" ]]; then
  echo "Missing $SRC — add a 1024×1024 master icon first."
  exit 1
fi

mkdir -p "$IOS_SET"

resize() {
  local size="$1"
  local out="$2"
  sips -z "$size" "$size" "$SRC" --out "$out" >/dev/null
}

# iOS (filename, size px)
resize 40  "$IOS_SET/Icon-20@2x.png"
resize 60  "$IOS_SET/Icon-20@3x.png"
resize 58  "$IOS_SET/Icon-29@2x.png"
resize 87  "$IOS_SET/Icon-29@3x.png"
resize 80  "$IOS_SET/Icon-40@2x.png"
resize 120 "$IOS_SET/Icon-40@3x.png"
resize 120 "$IOS_SET/Icon-60@2x.png"
resize 180 "$IOS_SET/Icon-60@3x.png"
cp "$SRC" "$IOS_SET/Icon-1024.png"

cat > "$IOS_SET/Contents.json" <<'EOF'
{
  "images": [
    { "filename": "Icon-20@2x.png", "idiom": "iphone", "scale": "2x", "size": "20x20" },
    { "filename": "Icon-20@3x.png", "idiom": "iphone", "scale": "3x", "size": "20x20" },
    { "filename": "Icon-29@2x.png", "idiom": "iphone", "scale": "2x", "size": "29x29" },
    { "filename": "Icon-29@3x.png", "idiom": "iphone", "scale": "3x", "size": "29x29" },
    { "filename": "Icon-40@2x.png", "idiom": "iphone", "scale": "2x", "size": "40x40" },
    { "filename": "Icon-40@3x.png", "idiom": "iphone", "scale": "3x", "size": "40x40" },
    { "filename": "Icon-60@2x.png", "idiom": "iphone", "scale": "2x", "size": "60x60" },
    { "filename": "Icon-60@3x.png", "idiom": "iphone", "scale": "3x", "size": "60x60" },
    { "filename": "Icon-1024.png", "idiom": "ios-marketing", "scale": "1x", "size": "1024x1024" }
  ],
  "info": { "author": "xcode", "version": 1 }
}
EOF

# Android launcher densities
for spec in "mdpi:48" "hdpi:72" "xhdpi:96" "xxhdpi:144" "xxxhdpi:192"; do
  density="${spec%%:*}"
  size="${spec##*:}"
  dir="$ANDROID_RES/mipmap-$density"
  mkdir -p "$dir"
  resize "$size" "$dir/ic_launcher.png"
  cp "$dir/ic_launcher.png" "$dir/ic_launcher_round.png"
done

echo "Generated iOS AppIcon and Android mipmaps from $SRC"
