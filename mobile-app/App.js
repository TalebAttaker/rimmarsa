import React, { useEffect } from 'react';
import { I18nManager, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import HomeScreen from './src/screens/HomeScreen';
import VendorRegistrationScreen from './src/screens/VendorRegistrationScreen';

const Stack = createStackNavigator();

// Force RTL layout for Arabic
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
}

const theme = {
  colors: {
    primary: '#EAB308',
    accent: '#F59E0B',
    background: '#1F2937',
    surface: '#111827',
    text: '#FFFFFF',
    disabled: '#6B7280',
    placeholder: '#9CA3AF',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  rtl: true,
  isRTL: true,
  fonts: {
    regular: {
      fontFamily: Platform.select({
        ios: 'System',
        android: 'sans-serif',
      }),
    },
    medium: {
      fontFamily: Platform.select({
        ios: 'System',
        android: 'sans-serif-medium',
      }),
    },
    bold: {
      fontFamily: Platform.select({
        ios: 'System',
        android: 'sans-serif',
      }),
      fontWeight: 'bold',
    },
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#111827',
            },
            headerTintColor: '#EAB308',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerTitleAlign: 'center',
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'ريمارسا' }}
          />
          <Stack.Screen
            name="VendorRegistration"
            component={VendorRegistrationScreen}
            options={{ title: 'تسجيل البائع' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
