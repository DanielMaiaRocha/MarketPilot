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
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET(request: NextRequest) {
  // Check if user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Generate a random state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15);

  // Store state in a cookie for verification later
  const response = NextResponse.redirect(
    new URL(
      `${GOOGLE_AUTH_URL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=https://www.googleapis.com/auth/adwords&state=${state}&access_type=offline&prompt=consent`,
    ),
  );

  response.cookies.set("ads_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
