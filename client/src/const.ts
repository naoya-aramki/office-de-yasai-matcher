export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// Generate Google OAuth login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const appId = import.meta.env.VITE_APP_ID;
  
  // Check if required environment variables are set
  if (!appId) {
    console.error("VITE_APP_ID is not configured");
    return "#";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    // Google OAuth 2.0 authorization endpoint
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");

    return url.toString();
  } catch (error) {
    console.error("Failed to construct login URL:", error);
    return "#";
  }
};