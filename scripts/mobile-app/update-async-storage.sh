#!/bin/bash
# Script to replace AsyncStorage with SecureTokenManager

FILES=(
  "src/screens/vendor/VendorSettingsScreen.js"
  "src/screens/vendor/VendorSubscriptionScreen.js"
  "src/screens/vendor/VendorAnalyticsScreen.js"
  "src/screens/vendor/AddProductScreen.js"
  "src/screens/vendor/VendorProductsScreen.js"
  "src/screens/vendor/VendorDashboardScreen.js"
  "src/screens/VendorRegistrationScreen.js"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Updating $file..."

    # Replace AsyncStorage import with SecureTokenManager
    sed -i "s/import AsyncStorage from '@react-native-async-storage\/async-storage';/import SecureTokenManager from '..\/..\/services\/secureStorage';/g" "$file"

    # Replace getItem calls
    sed -i "s/AsyncStorage\.getItem('\([^']*\)')/SecureTokenManager.getItem('\1')/g" "$file"
    sed -i 's/AsyncStorage\.getItem("\([^"]*\)")/SecureTokenManager.getItem("\1")/g' "$file"

    # Replace setItem calls
    sed -i "s/AsyncStorage\.setItem('\([^']*\)',/SecureTokenManager.saveItem('\1',/g" "$file"
    sed -i 's/AsyncStorage\.setItem("\([^"]*\)",/SecureTokenManager.saveItem("\1",/g' "$file"

    # Replace removeItem calls
    sed -i "s/AsyncStorage\.removeItem('\([^']*\)')/SecureTokenManager.deleteItem('\1')/g" "$file"
    sed -i 's/AsyncStorage\.removeItem("\([^"]*\)")/SecureTokenManager.deleteItem("\1")/g' "$file"

    echo "✓ Updated $file"
  else
    echo "✗ File not found: $file"
  fi
done

echo "Done!"
