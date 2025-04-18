export default ({ config }) => ({
  ...config,
  scheme: "yomi",
  name: "Yomi",
  slug: "yomi",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "dark",
  assetBundlePatterns: [
    "**/*"
  ],

  android: {
    package: "com.elinapatjas.yomi",
    versionCode: 2
  },

  ios: {
    bundleIdentifier: "com.elinapatjas.yomi",
    buildNumber: "2",
    supportsTablet: true,
    config: {
      usesNonExemptEncryption: false
    }
  },
  extra: {
    eas: {
      projectId: "e0b5ebfb-b473-4428-95e1-819267d35f1f"
    },
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  plugins: [
    "expo-build-properties"
  ],
  developmentClient: {
    silentLaunch: false
  }
});
