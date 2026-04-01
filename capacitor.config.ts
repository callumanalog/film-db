import "dotenv/config";
import type { CapacitorConfig } from "@capacitor/cli";

const appId = process.env.CAPACITOR_APP_ID ?? "club.exposure.app";
const appName = process.env.CAPACITOR_APP_NAME ?? "Exposure Club";
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();
const allowCleartext = serverUrl?.startsWith("http://") ?? false;

const config: CapacitorConfig = {
  appId,
  appName,
  webDir: "capacitor/www",
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#fdfaf5",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#fdfaf5",
      overlaysWebView: true,
    },
  },
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: allowCleartext,
          androidScheme: allowCleartext ? "http" : "https",
        },
      }
    : {}),
};

export default config;
