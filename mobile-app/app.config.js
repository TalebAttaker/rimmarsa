export default {
  expo: {
    name: "ريمارسا - البائع",
    slug: "rimmarsa",
    version: "1.7.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0F172A"
    },
    plugins: [
      "expo-font"
    ],
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0F172A"
      },
      package: "com.rimmarsa.mobile"
    },
    ios: {
      bundleIdentifier: "com.rimmarsa.mobile"
    }
  }
};
