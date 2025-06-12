#!/bin/bash

echo "🧹 Clearing Flai app data..."

# Kill any running Metro bundler
echo "Stopping Metro bundler..."
pkill -f "metro" || true

# Clear Metro cache
echo "Clearing Metro cache..."
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-map-* 2>/dev/null || true

# Clear React Native cache
echo "Clearing React Native cache..."
rm -rf $TMPDIR/react-* 2>/dev/null || true

# Clear Expo cache
echo "Clearing Expo cache..."
rm -rf ~/.expo 2>/dev/null || true

# For Android emulator (if running)
if command -v adb &> /dev/null; then
    echo "Clearing Android app data..."
    adb shell pm clear host.exp.exponent 2>/dev/null || true
fi

echo "✅ App data cleared!"
echo ""
echo "Now run: npm start -- --clear"
echo "This will start Expo with a clean cache" 