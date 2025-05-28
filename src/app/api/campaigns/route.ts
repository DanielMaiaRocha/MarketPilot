import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { getOAuthTokenAction } from "@/app/actions";

// Google Ads API endpoint
const GOOGLE_ADS_API_URL = "https://googleads.googleapis.com/v14/customers";
// Meta Ads API endpoint
const META_ADS_API_URL = "https://graph.facebook.com/v18.0";

async function refreshGoogleToken(refreshToken: string) {
  const GOOGLE_CLIENT_ID =
    process.env.GOOGLE_ADS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET =
    process.env.GOOGLE_ADS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Google token");
  }

  return await response.json();
}

async function refreshMetaToken(accessToken: string) {
  const META_APP_ID = process.env.META_APP_ID;
  const META_APP_SECRET = process.env.META_APP_SECRET;

  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${accessToken}`,
    { method: "GET" },
  );

  if (!response.ok) {
    throw new Error("Failed to refresh Meta token");
  }

  return await response.json();
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get("platform");
  const startDate =
    searchParams.get("startDate") ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // Default to last 30 days
  const endDate =
    searchParams.get("endDate") || new Date().toISOString().split("T")[0]; // Default to today

  try {
    // Check if we already have cached data for this request
    const { data: cachedData } = await supabase
      .from("campaign_data")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", platform)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    // If we have recent cached data (less than 1 hour old), return it
    const latestCachedData = cachedData?.sort(
      (a, b) =>
        new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime(),
    )[0];

    const cacheExpiry = 60 * 60 * 1000; // 1 hour in milliseconds
    if (
      latestCachedData &&
      new Date().getTime() - new Date(latestCachedData.fetched_at).getTime() <
        cacheExpiry
    ) {
      return NextResponse.json({ data: cachedData });
    }

    // Otherwise, fetch fresh data from the respective platform
    let campaignData: any[] = [];

    if (platform === "google_ads") {
      // Get Google Ads token
      let token = await getOAuthTokenAction("google_ads");

      if (!token) {
        return NextResponse.json(
          { error: "Google Ads not connected" },
          { status: 400 },
        );
      }

      // Check if token is expired and refresh if needed
      if (token.expires_at && new Date(token.expires_at) <= new Date()) {
        if (!token.refresh_token) {
          return NextResponse.json(
            {
              error: "Google Ads token expired and no refresh token available",
            },
            { status: 400 },
          );
        }

        const refreshedToken = await refreshGoogleToken(token.refresh_token);

        // Calculate new expiration time
        const expiresAt = new Date();
        expiresAt.setSeconds(
          expiresAt.getSeconds() + refreshedToken.expires_in,
        );

        // Update token in database
        await supabase
          .from("oauth_tokens")
          .update({
            access_token: refreshedToken.access_token,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", token.id);

        token.access_token = refreshedToken.access_token;
      }

      // Fetch Google Ads campaign data
      // This is a simplified example - in a real implementation, you would use the Google Ads API
      // For now, we'll generate mock data
      campaignData = generateMockGoogleAdsData(startDate, endDate);
    } else if (platform === "meta_ads") {
      // Get Meta Ads token
      let token = await getOAuthTokenAction("meta_ads");

      if (!token) {
        return NextResponse.json(
          { error: "Meta Ads not connected" },
          { status: 400 },
        );
      }

      // Check if token is expired and refresh if needed
      if (token.expires_at && new Date(token.expires_at) <= new Date()) {
        const refreshedToken = await refreshMetaToken(token.access_token);

        // Calculate new expiration time
        const expiresAt = new Date();
        expiresAt.setSeconds(
          expiresAt.getSeconds() + refreshedToken.expires_in,
        );

        // Update token in database
        await supabase
          .from("oauth_tokens")
          .update({
            access_token: refreshedToken.access_token,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", token.id);

        token.access_token = refreshedToken.access_token;
      }

      // Fetch Meta Ads campaign data
      // This is a simplified example - in a real implementation, you would use the Meta Ads API
      // For now, we'll generate mock data
      campaignData = generateMockMetaAdsData(startDate, endDate);
    } else {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    // Store the fetched data in the database
    for (const campaign of campaignData) {
      await supabase.from("campaign_data").insert({
        user_id: user.id,
        platform,
        campaign_id: campaign.campaign_id,
        campaign_name: campaign.campaign_name,
        date: campaign.date,
        spend: campaign.spend,
        clicks: campaign.clicks,
        impressions: campaign.impressions,
        conversions: campaign.conversions,
        cpc: campaign.cpc,
        fetched_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ data: campaignData });
  } catch (error) {
    console.error(`Error fetching ${platform} campaign data:`, error);
    return NextResponse.json(
      { error: `Failed to fetch campaign data: ${error}` },
      { status: 500 },
    );
  }
}

// Helper function to generate mock Google Ads data
function generateMockGoogleAdsData(startDate: string, endDate: string) {
  const data = [];
  const campaigns = [
    { id: "g-1", name: "Brand Awareness" },
    { id: "g-2", name: "Product Launch" },
    { id: "g-3", name: "Retargeting" },
  ];

  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysBetween = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  for (let i = 0; i < daysBetween; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(currentDate.getDate() + i);
    const dateString = currentDate.toISOString().split("T")[0];

    for (const campaign of campaigns) {
      const spend = Math.random() * 100 + 50;
      const clicks = Math.floor(Math.random() * 200 + 50);
      const impressions = Math.floor(Math.random() * 5000 + 1000);
      const conversions = Math.floor(Math.random() * 20);

      data.push({
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        date: dateString,
        spend: parseFloat(spend.toFixed(2)),
        clicks,
        impressions,
        conversions,
        cpc: parseFloat((spend / clicks).toFixed(2)),
      });
    }
  }

  return data;
}

// Helper function to generate mock Meta Ads data
function generateMockMetaAdsData(startDate: string, endDate: string) {
  const data = [];
  const campaigns = [
    { id: "m-1", name: "Facebook Engagement" },
    { id: "m-2", name: "Instagram Stories" },
    { id: "m-3", name: "Carousel Ads" },
  ];

  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysBetween = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  for (let i = 0; i < daysBetween; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(currentDate.getDate() + i);
    const dateString = currentDate.toISOString().split("T")[0];

    for (const campaign of campaigns) {
      const spend = Math.random() * 80 + 40;
      const clicks = Math.floor(Math.random() * 150 + 40);
      const impressions = Math.floor(Math.random() * 4000 + 800);
      const conversions = Math.floor(Math.random() * 15);

      data.push({
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        date: dateString,
        spend: parseFloat(spend.toFixed(2)),
        clicks,
        impressions,
        conversions,
        cpc: parseFloat((spend / clicks).toFixed(2)),
      });
    }
  }

  return data;
}
