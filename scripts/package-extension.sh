#!/bin/bash

# Chrome Extension Packaging Script
# This script creates a ZIP file ready for Chrome Web Store submission

echo "📦 Packaging Chrome Extension for Web Store..."

# Get version from manifest.json
VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
EXTENSION_NAME="SunnySight-AI-Repo-Analyzer"
ZIP_NAME="${EXTENSION_NAME}-v${VERSION}.zip"

# Create temporary directory
TEMP_DIR="temp_package"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "📋 Copying required files..."

# Copy essential files
cp manifest.json "$TEMP_DIR/"
cp popup.html "$TEMP_DIR/"
cp popup.js "$TEMP_DIR/"
cp settings.html "$TEMP_DIR/"
cp settings.js "$TEMP_DIR/"
cp content.js "$TEMP_DIR/"
cp api.js "$TEMP_DIR/"
cp analyzer.js "$TEMP_DIR/"
cp styles.css "$TEMP_DIR/"

# Copy icons folder (excluding README and extra icons)
mkdir -p "$TEMP_DIR/icons"
cp icons/icon16.png "$TEMP_DIR/icons/" 2>/dev/null || true
cp icons/icon48.png "$TEMP_DIR/icons/" 2>/dev/null || true
cp icons/icon128.png "$TEMP_DIR/icons/" 2>/dev/null || true

echo "✅ Files copied"

# Create ZIP file
echo "🗜️  Creating ZIP file..."
cd "$TEMP_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store" "*.git*" > /dev/null
cd ..

# Clean up
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Package created successfully!"
echo "📦 File: $ZIP_NAME"
echo ""
echo "📤 Next steps:"
echo "1. Go to https://chrome.google.com/webstore/devconsole"
echo "2. Click 'New Item' to upload your extension"
echo "3. Upload the ZIP file: $ZIP_NAME"
echo "4. Fill in the store listing details"
echo "5. Make sure your Privacy Policy is hosted at a public HTTPS URL"
echo ""
echo "⚠️  Note: Privacy Policy must be hosted separately (e.g., on GitHub)"
echo "   Current file: PRIVACY_POLICY.md (needs to be accessible via HTTPS URL)"

