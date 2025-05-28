import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { SubscriptionCheck } from "@/components/subscription-check";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, User, Shield } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user profile data
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get subscription data
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Account Settings</h1>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="subscription"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account profile information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={profile?.name || ""}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={user.email || ""}
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="Your company name"
                    />
                  </div>

                  <Button type="submit">Update Profile</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>
                  Manage your subscription plan and billing information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Current Plan</h3>
                    <div className="bg-secondary/50 p-4 rounded-lg">
                      {subscription ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {subscription.price_id === "price_starter"
                                ? "Starter"
                                : subscription.price_id === "price_pro"
                                  ? "Pro"
                                  : "Premium"}{" "}
                              Plan
                            </span>
                            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Active
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>
                              Billing period:{" "}
                              {subscription.interval === "month"
                                ? "Monthly"
                                : "Yearly"}
                            </p>
                            <p>
                              Next billing date:{" "}
                              {subscription.current_period_end
                                ? new Date(
                                    subscription.current_period_end * 1000,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Free Trial</span>
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Active
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>
                              Your free trial gives you access to basic
                              features.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-medium">Manage Subscription</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild>
                        <Link href="/pricing">
                          {subscription ? "Change Plan" : "Upgrade to Premium"}
                        </Link>
                      </Button>
                      {subscription && (
                        <Button
                          variant="outline"
                          className="text-red-500 hover:text-red-700"
                        >
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Payment Method</h3>
                    <div className="bg-secondary/50 p-4 rounded-lg">
                      {subscription ? (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            <span>•••• •••• •••• 4242</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            Update
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          <p>No payment method on file.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">
                          Current Password
                        </Label>
                        <Input
                          id="current-password"
                          name="currentPassword"
                          type="password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          name="newPassword"
                          type="password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirm-password"
                          name="confirmPassword"
                          type="password"
                        />
                      </div>
                      <Button type="submit">Update Password</Button>
                    </form>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Two-Factor Authentication
                    </h3>
                    <div className="bg-secondary/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            Two-factor authentication is not enabled
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Button variant="outline" disabled>
                          Coming Soon
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Connected Accounts</h3>
                    <div className="space-y-2">
                      <div className="bg-secondary/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Google</p>
                            <p className="text-sm text-muted-foreground">
                              {profile?.google_id
                                ? "Connected"
                                : "Not connected"}
                            </p>
                          </div>
                          <Button variant="outline">
                            {profile?.google_id ? "Disconnect" : "Connect"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </SubscriptionCheck>
  );
}
