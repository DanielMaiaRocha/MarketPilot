import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../supabase/server";
import { InfoIcon, UserCircle, BarChart3, Users, Mail } from "lucide-react";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import { DashboardSummary } from "@/components/dashboard-summary";
import AdAccountStatus from "@/components/ad-account-status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Marketing Dashboard</h1>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/dashboard/leads">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Leads
                  </Link>
                </Button>
              </div>
            </div>
            <div className="bg-secondary/50 text-sm p-3 px-4 rounded-lg text-muted-foreground flex gap-2 items-center">
              <InfoIcon size="14" />
              <span>
                Welcome to your marketing dashboard. Connect your ad accounts
                and manage your leads.
              </span>
            </div>
          </header>

          {/* Dashboard Summary */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Overview</h2>
            <DashboardSummary userId={user.id} />
          </section>

          {/* Ad Accounts Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Ad Platforms</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <AdAccountStatus
                provider="google_ads"
                title="Google Ads"
                description="Connect your Google Ads account to track performance metrics"
              />
              <AdAccountStatus
                provider="meta_ads"
                title="Meta Ads"
                description="Connect your Meta Ads account to track Facebook and Instagram ads"
              />
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Lead Management
                  </CardTitle>
                  <CardDescription>
                    Create and manage your sales leads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/dashboard/leads">View Leads</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Campaigns
                  </CardTitle>
                  <CardDescription>
                    Create and schedule email campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button disabled className="w-full">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Campaign Reports
                  </CardTitle>
                  <CardDescription>
                    View performance metrics for your campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button disabled className="w-full">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* User Profile Section */}
          <section className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <UserCircle size={48} className="text-primary" />
              <div>
                <h2 className="font-semibold text-xl">User Profile</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 overflow-hidden">
              <pre className="text-xs font-mono max-h-48 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </section>
        </div>
      </main>
    </SubscriptionCheck>
  );
}
