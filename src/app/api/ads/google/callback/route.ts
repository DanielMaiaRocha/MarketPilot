import { createClient } from "../../../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { saveOAuthTokenAction } from "@/app/actions";

// Google Ads OAuth configuration
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_ADS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_ADS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/ads/google/callback`
  : "http://localhost:3000/api/ads/google/callback";

// Google OAuth endpoints
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");

  // Get the state from the cookie for verification
  const storedState = request.cookies.get("ads_oauth_state")?.value;

  // Clear the state cookie
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.delete("ads_oauth_state");

  // Check for errors or invalid state
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=${encodeURIComponent("Google Ads authentication failed")}`,
      ),
    );
  }

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=${encodeURIComponent("Invalid authentication state")}`,
      ),
    );
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await tokenResponse.json();

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Save tokens to database
    await saveOAuthTokenAction(
      "google_ads",
      tokens.access_token,
      tokens.refresh_token,
      expiresAt,
    );

    return NextResponse.redirect(
      new URL(
        "/dashboard?success=Google Ads connected successfully",
        request.url,
      ),
    );
  } catch (error) {
    console.error("Google Ads OAuth error:", error);
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=${encodeURIComponent("Failed to connect Google Ads")}`,
      ),
    );
  }
}
