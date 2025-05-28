import { createClient } from "../../../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { saveOAuthTokenAction } from "@/app/actions";

// Meta Ads OAuth configuration
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/ads/meta/callback`
  : "http://localhost:3000/api/ads/meta/callback";

// Meta OAuth endpoints
const META_TOKEN_URL = "https://graph.facebook.com/v18.0/oauth/access_token";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");

  // Get the state from the cookie for verification
  const storedState = request.cookies.get("meta_oauth_state")?.value;

  // Clear the state cookie
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.delete("meta_oauth_state");

  // Check for errors or invalid state
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=${encodeURIComponent("Meta Ads authentication failed")}`,
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
    const tokenUrl = new URL(META_TOKEN_URL);
    tokenUrl.searchParams.append("client_id", META_APP_ID!);
    tokenUrl.searchParams.append("client_secret", META_APP_SECRET!);
    tokenUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    tokenUrl.searchParams.append("code", code);

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
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
      "meta_ads",
      tokens.access_token,
      null, // Meta doesn't provide refresh tokens in the same way
      expiresAt,
    );

    return NextResponse.redirect(
      new URL(
        "/dashboard?success=Meta Ads connected successfully",
        request.url,
      ),
    );
  } catch (error) {
    console.error("Meta Ads OAuth error:", error);
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=${encodeURIComponent("Failed to connect Meta Ads")}`,
      ),
    );
  }
}
