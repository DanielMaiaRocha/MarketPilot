import { createClient } from "../../../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`
  : "http://localhost:3000/api/auth/google/callback";

// Google OAuth endpoints
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");

  // Get the state from the cookie for verification
  const storedState = request.cookies.get("oauth_state")?.value;

  // Clear the state cookie
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.delete("oauth_state");

  // Check for errors or invalid state
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/sign-in?error=${encodeURIComponent("Google authentication failed")}`,
      ),
    );
  }

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      new URL(
        `/sign-in?error=${encodeURIComponent("Invalid authentication state")}`,
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

    // Get user info from Google
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const googleUser = await userInfoResponse.json();

    // Initialize Supabase client
    const supabase = await createClient();

    // Check if user exists with this Google ID
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", googleUser.email)
      .single();

    if (existingUser) {
      // Update Google ID if not set
      if (!existingUser.google_id) {
        await supabase
          .from("users")
          .update({ google_id: googleUser.id })
          .eq("id", existingUser.id);
      }

      // Sign in the user
      const { error } = await supabase.auth.signInWithPassword({
        email: googleUser.email,
        password: `google-oauth-${googleUser.id}`, // This will fail if user was created with email/password
      });

      if (error) {
        // If sign-in fails, try to create a new account
        const {
          data: { user },
          error: signUpError,
        } = await supabase.auth.signUp({
          email: googleUser.email,
          password: `google-oauth-${googleUser.id}`,
          options: {
            data: {
              full_name: googleUser.name,
              email: googleUser.email,
            },
          },
        });

        if (signUpError || !user) {
          throw new Error("Failed to create or sign in user");
        }

        // Create user record
        await supabase.from("users").insert({
          id: user.id,
          user_id: user.id,
          name: googleUser.name,
          email: googleUser.email,
          google_id: googleUser.id,
          avatar_url: googleUser.picture,
          token_identifier: user.id,
        });
      }
    } else {
      // Create a new user with Google info
      const {
        data: { user },
        error,
      } = await supabase.auth.signUp({
        email: googleUser.email,
        password: `google-oauth-${googleUser.id}`,
        options: {
          data: {
            full_name: googleUser.name,
            email: googleUser.email,
          },
        },
      });

      if (error || !user) {
        throw new Error("Failed to create user");
      }

      // Create user record
      await supabase.from("users").insert({
        id: user.id,
        user_id: user.id,
        name: googleUser.name,
        email: googleUser.email,
        google_id: googleUser.id,
        avatar_url: googleUser.picture,
        token_identifier: user.id,
      });
    }

    return response;
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent("Authentication failed")}`),
    );
  }
}
