export default {
  expo: {
    name: "ريمارسا - البائع",
    slug: "rimmarsa",
    version: "1.3.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0F172A"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0F172A"
      },
      package: "com.rimmarsa.mobile"
    },
    extra: {
      eas: {
        projectId: "bf9384bd-86ef-4bbf-982e-e79d6a57e912"
      }
    }
  }
};
