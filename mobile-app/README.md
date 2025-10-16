# Rimmarsa Mobile App (React Native)

## Overview
Arabic-first mobile application for the Rimmarsa marketplace platform in Mauritania.

## Features
- ✅ Full Arabic language support with RTL layout
- ✅ Vendor registration with image uploads
- ✅ Upload progress tracking
- ✅ Product browsing
- ✅ Vendor profiles
- ✅ Integration with Supabase backend

## Tech Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend**: Supabase
- **UI**: React Native Paper (Material Design)
- **Navigation**: React Navigation
- **State**: React Context API
- **Fonts**: Cairo (Arabic-optimized)

## Project Structure
```
mobile-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ImageUpload.tsx # Upload component with progress
│   │   └── RTLView.tsx     # RTL wrapper component
│   ├── screens/            # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── VendorRegistrationScreen.tsx
│   │   ├── ProductsScreen.tsx
│   │   └── VendorProfileScreen.tsx
│   ├── navigation/         # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── services/           # API services
│   │   └── supabase.ts
│   ├── hooks/              # Custom React hooks
│   │   └── useImageUpload.ts
│   ├── utils/              # Utility functions
│   │   └── rtl.ts
│   └── constants/          # App constants
│       └── arabic-text.ts
├── assets/                 # Images, fonts, etc.
├── app.json               # Expo configuration
├── package.json
└── tsconfig.json

```

## Setup Instructions

### Prerequisites
- Node.js 20+ installed
- Expo CLI installed: `npm install -g expo-cli`
- Android Studio (for Android) or Xcode (for iOS)

### Installation

```bash
cd mobile-app

# Install dependencies
npm install

# Install required packages
npm install @supabase/supabase-js
npm install react-native-paper
npm install @react-navigation/native
npm install @react-navigation/stack
npm install expo-image-picker
npm install expo-file-system

# Start development server
npm start
```

### Run on Device

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

**Expo Go App:**
1. Install Expo Go from App Store/Play Store
2. Scan QR code from terminal

## Configuration

### Supabase Configuration
Create `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### RTL Configuration
The app automatically detects and applies RTL layout for Arabic content.

## Key Features Implementation

### 1. Vendor Registration
The vendor registration screen includes:
- Multi-step form (4 steps)
- Image uploads with progress bars
- Region/City selection
- Pricing plan selection
- Form validation
- Duplicate request prevention

### 2. Image Upload with Progress
```typescript
const { upload, progress } = useImageUpload()

// Upload returns URL and tracks progress (0-100)
const imageUrl = await upload(imageFile)
```

### 3. Arabic Text Support
All text content is in Arabic with proper RTL layout:
- Form labels
- Button text
- Error messages
- Success notifications

## Screens

### Home Screen
- Hero section with statistics
- Categories grid
- Recent products
- Navigation to vendor registration

### Vendor Registration Screen
**Step 1: معلومات العمل (Business Information)**
- Business name
- Owner name
- Email
- Phone
- WhatsApp number

**Step 2: الموقع (Location)**
- Region selection
- City selection
- Address

**Step 3: المستندات (Documents)**
- National ID (NNI) image
- Personal photo
- Store photo

**Step 4: الدفع (Payment)**
- Pricing plan selection
- Payment screenshot upload

### Products Screen
- Browse all products
- Filter by category
- Search functionality

### Vendor Profile Screen
- Vendor information
- Product listings
- Contact via WhatsApp

## Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

### Managed Publishing
```bash
# Publish update to Expo
expo publish

# Submit to stores
expo submit:android
expo submit:ios
```

## Environment Variables
Required environment variables:
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Deployment

The mobile app can be deployed via:
1. **Expo Go** (development)
2. **Standalone APK/IPA** (production)
3. **App Store/Play Store** (official release)

## Known Issues & Solutions

### Issue: Upload Progress Not Showing
**Solution**: Ensure you're using `expo-file-system` for upload tracking

### Issue: RTL Layout Issues
**Solution**: Use `I18nManager.forceRTL(true)` in App.tsx

### Issue: Image Picker Not Working
**Solution**: Add permissions in app.json:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "The app needs access to your photos"
        }
      ]
    ]
  }
}
```

## Support & Contribution
For issues or contributions, contact the development team.

## License
Proprietary - Rimmarsa Platform 2025
