#!/bin/bash
# Creates a distributable zip of the InvestmentApp project.
# Run from the InvestmentApp directory: bash create_zip.sh

set -e

ZIPNAME="AlphaSignal-InvestmentResearchAgent.zip"

echo "📦 Creating zip: $ZIPNAME"

zip -r "$ZIPNAME" . \
  --exclude "*/node_modules/*" \
  --exclude "*/.git/*" \
  --exclude "*/dist/*" \
  --exclude "*/.env" \
  --exclude "**/.DS_Store"

echo "✅ Done: $ZIPNAME ($(du -sh "$ZIPNAME" | cut -f1))"
