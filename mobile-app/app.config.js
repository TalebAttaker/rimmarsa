import 'dotenv/config';

export default {
  expo: {
    name: "ريمارسا",
    slug: "rimmarsa",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0F172A"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.rimmarsa.mobile"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0F172A"
      },
      package: "com.rimmarsa.mobile",
      permissions: [
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "CAMERA"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "يحتاج التطبيق إلى الوصول إلى صورك لتحميل المستندات"
        }
      ]
    ],
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      eas: {
        projectId: "bf9384bd-86ef-4bbf-982e-e79d6a57e912"
      }
    }
  }
};
