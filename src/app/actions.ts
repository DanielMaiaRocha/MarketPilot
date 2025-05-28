"use server";

import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        email: email,
      },
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (user) {
    try {
      const { error: updateError } = await supabase.from("users").insert({
        id: user.id,
        user_id: user.id,
        name: fullName,
        email: email,
        token_identifier: user.id,
        created_at: new Date().toISOString(),
      });

      if (updateError) {
        // Error handling without console.error
        return encodedRedirect(
          "error",
          "/sign-up",
          "Error updating user. Please try again.",
        );
      }
    } catch (err) {
      // Error handling without console.error
      return encodedRedirect(
        "error",
        "/sign-up",
        "Error updating user. Please try again.",
      );
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {});

  if (error) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const checkUserSubscription = async (userId: string) => {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error) {
    return false;
  }

  return !!subscription;
};

// Lead Management Actions
export const createLeadAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "You must be logged in to create leads",
    );
  }

  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const phone = formData.get("phone")?.toString();
  const status = formData.get("status")?.toString() || "new";
  const notes = formData.get("notes")?.toString();

  if (!name) {
    return encodedRedirect(
      "error",
      "/dashboard/leads",
      "Lead name is required",
    );
  }

  const { error } = await supabase.from("leads").insert({
    user_id: user.id,
    name,
    email,
    phone,
    status,
    notes,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/dashboard/leads",
      "Failed to create lead",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/leads",
    "Lead created successfully",
  );
};

export const updateLeadAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "You must be logged in to update leads",
    );
  }

  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const phone = formData.get("phone")?.toString();
  const status = formData.get("status")?.toString();
  const notes = formData.get("notes")?.toString();

  if (!id || !name) {
    return encodedRedirect(
      "error",
      "/dashboard/leads",
      "Lead ID and name are required",
    );
  }

  // First check if the lead belongs to the user
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!lead) {
    return encodedRedirect(
      "error",
      "/dashboard/leads",
      "Lead not found or you don't have permission",
    );
  }

  const { error } = await supabase
    .from("leads")
    .update({
      name,
      email,
      phone,
      status,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return encodedRedirect(
      "error",
      "/dashboard/leads",
      "Failed to update lead",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/leads",
    "Lead updated successfully",
  );
};

export const deleteLeadAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "You must be logged in to delete leads",
    );
  }

  const id = formData.get("id")?.toString();

  if (!id) {
    return encodedRedirect("error", "/dashboard/leads", "Lead ID is required");
  }

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return encodedRedirect(
      "error",
      "/dashboard/leads",
      "Failed to delete lead",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/leads",
    "Lead deleted successfully",
  );
};

// OAuth Token Management
export const saveOAuthTokenAction = async (
  provider: string,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date | null,
) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Check if token already exists for this user and provider
  const { data: existingToken } = await supabase
    .from("oauth_tokens")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .single();

  if (existingToken) {
    // Update existing token
    const { error } = await supabase
      .from("oauth_tokens")
      .update({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt?.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingToken.id);

    if (error) throw error;
  } else {
    // Create new token
    const { error } = await supabase.from("oauth_tokens").insert({
      user_id: user.id,
      provider,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt?.toISOString(),
    });

    if (error) throw error;
  }

  return true;
};

export const getOAuthTokenAction = async (provider: string) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data: token, error } = await supabase
    .from("oauth_tokens")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .single();

  if (error) return null;

  return token;
};
