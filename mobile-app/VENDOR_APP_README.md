# Rimmarsa Vendor Mobile App

Complete vendor management mobile application built with React Native and Expo.

## Features

### 🔐 Authentication
- Phone-based vendor login
- Secure password authentication
- 24-hour session management
- Automatic logout on session expiry

### 📊 Dashboard
- Overview with key metrics
- Total and active products count
- Profile view statistics
- Subscription status with expiry warnings
- Quick action buttons

### 📦 Product Management
- **List all products** with search and filters
- **Add products** with up to 6 images per product
- **Edit products** (coming soon)
- **Delete products** with confirmation
- Toggle product visibility (active/inactive)
- Real-time product statistics

### 🖼️ Multi-Image Upload (UP TO 6 IMAGES)
- Select up to 6 images from device gallery
- Image preview with thumbnails
- Remove individual images
- First image becomes primary product image
- Automatic image compression and optimization
- Direct upload to Supabase storage

### 📈 Analytics
- Total profile views
- Daily views (last 24 hours)
- Weekly views (last 7 days)
- Monthly views (last 30 days)
- Real-time statistics updates

### 💳 Subscription Management
- Current subscription details
- Plan type and pricing
- Start and end dates
- Days remaining with visual warnings
- Subscription history
- Status badges (active/expired/cancelled)

### ⚙️ Settings
- Account settings
- Notifications (coming soon)
- Language selection (coming soon)
- Help and support (coming soon)
- Terms and conditions (coming soon)
- Logout functionality

## Technology Stack

- **React Native** with Expo
- **React Navigation** (Stack + Bottom Tabs)
- **Supabase** for backend and storage
- **AsyncStorage** for local data persistence
- **Expo Image Picker** for multi-image upload
- **Vector Icons** for UI elements
- **React Native Paper** for UI components

## Installation

1. Navigate to the mobile app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure Supabase:
   - Update `src/services/supabase.js` with your Supabase URL and anon key

4. Start the development server:
```bash
npm start
```

5. Run on device/emulator:
```bash
# iOS
npm run ios

# Android
npm run android
```

## Project Structure

```
mobile-app/
├── App.js                          # Main app entry with navigation
├── src/
│   ├── screens/
│   │   ├── vendor/
│   │   │   ├── VendorLoginScreen.js       # Vendor authentication
│   │   │   ├── VendorDashboardScreen.js   # Main dashboard
│   │   │   ├── VendorProductsScreen.js    # Products list
│   │   │   ├── AddProductScreen.js        # Add product with multi-image upload
│   │   │   ├── EditProductScreen.js       # Edit product
│   │   │   ├── VendorAnalyticsScreen.js   # Analytics and stats
│   │   │   ├── VendorSubscriptionScreen.js # Subscription management
│   │   │   └── VendorSettingsScreen.js    # Settings
│   ├── navigation/
│   │   └── VendorNavigator.js      # Bottom tab navigation
│   ├── components/
│   │   └── vendor/                 # Vendor-specific components
│   └── services/
│       └── supabase.js             # Supabase client configuration
├── assets/                         # Images and fonts
└── package.json                    # Dependencies
```

## Features in Detail

### Multi-Image Upload
- **Maximum 6 images per product**
- Images are numbered (1-6) for easy identification
- First image is the primary product image
- Images uploaded to Supabase storage bucket: `product-images`
- Automatic file naming: `{vendorId}/{timestamp}-{random}.{ext}`
- Support for JPEG, PNG, WEBP, GIF formats
- 5MB size limit per image
- Image compression and optimization

### Product Management
- Search products by name (Arabic/English)
- Filter by status (all/active/inactive)
- View product details:
  - Name, description, category
  - Price and compare-at price
  - Stock quantity
  - View count
  - Status (active/inactive)
- Quick actions:
  - Edit (navigate to edit screen)
  - Toggle visibility
  - Delete with confirmation

### Analytics Tracking
- Automatic profile view tracking
- Statistics aggregation:
  - Total views (all-time)
  - Today's views (last 24 hours)
  - Week views (last 7 days)
  - Month views (last 30 days)
- Pull-to-refresh for real-time updates

### Subscription Tracking
- Active subscription display
- Plan details (type, amount, dates)
- Visual warning when subscription < 7 days remaining
- Full subscription history
- Color-coded status badges
- Days remaining calculation

## Database Functions Used

### Authentication
- `vendor_login(phone_number, login_password)` - Secure vendor login

### Analytics
- `get_vendor_profile_stats(vendor_uuid)` - Get profile view statistics
- `track_profile_view(vendor_uuid, ip_address, user_agent, referrer)` - Log views

### Data Access
- Standard Supabase queries for:
  - Products CRUD operations
  - Subscription history
  - Categories, regions, cities

## UI/UX Features

- **RTL Support** - Full right-to-left layout for Arabic
- **Dark Theme** - Elegant dark UI with yellow accents
- **Smooth Animations** - Framer Motion-like transitions
- **Pull-to-Refresh** - Refresh data on all list screens
- **Loading States** - Clear loading indicators
- **Empty States** - Helpful messages when no data
- **Error Handling** - User-friendly error messages
- **Toast Notifications** - Success/error feedback

## Security

- Session management with 24-hour auto-logout
- Secure password storage (hashed in database)
- AsyncStorage for local session data
- No sensitive data in code
- Supabase RLS policies enforced

## Performance

- Lazy loading of images
- Optimized list rendering with FlatList
- Image caching
- Minimal re-renders with proper state management
- Efficient navigation structure

## Future Enhancements

- [ ] Edit product functionality
- [ ] Product image reordering
- [ ] Bulk product operations
- [ ] Push notifications
- [ ] In-app chat support
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Offline mode with sync
- [ ] Product analytics (individual product views)
- [ ] Sales tracking
- [ ] Order management

## Support

For support, contact the Rimmarsa admin team or refer to the main project documentation.

## License

© 2025 Rimmarsa. All rights reserved.
