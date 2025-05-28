import { createClient } from "../../../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Meta Ads OAuth configuration
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/ads/meta/callback`
  : "http://localhost:3000/api/ads/meta/callback";

// Meta OAuth endpoints
const META_AUTH_URL = "https://www.facebook.com/v18.0/dialog/oauth";

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
      `${META_AUTH_URL}?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=ads_management,pages_read_engagement,business_management`,
    ),
  );

  response.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
