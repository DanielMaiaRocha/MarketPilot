import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { SubscriptionCheck } from "@/components/subscription-check";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailAutomationForm from "@/components/email-automation-form";
import EmailTemplates from "@/components/email-templates";

export default async function AutomationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch automations for the user
  const { data: automations } = await supabase
    .from("email_automations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Email Automations</h1>
        </div>

        <Tabs defaultValue="automations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="automations">Automations</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="automations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Create Automation
                </h2>
                <EmailAutomationForm />
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Active Automations ({automations?.length || 0})
                </h2>
                {automations && automations.length > 0 ? (
                  <div className="space-y-4">
                    {automations.map((automation) => (
                      <AutomationCard
                        key={automation.id}
                        automation={automation}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted p-6 rounded-lg text-center">
                    <p className="text-muted-foreground">
                      No automations yet. Create your first automation to start
                      engaging with your leads automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <EmailTemplates />
          </TabsContent>
        </Tabs>
      </main>
    </SubscriptionCheck>
  );
}

function AutomationCard({ automation }: { automation: any }) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{automation.name}</h3>
          <p className="text-sm text-muted-foreground">
            {automation.trigger_type === "time"
              ? `Sends ${automation.delay_days} days after lead creation`
              : `Sends when lead status changes to ${automation.trigger_status}`}
          </p>
        </div>
        <div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${automation.status === "active" ? "bg-green-100 text-green-800" : automation.status === "paused" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
          >
            {automation.status.charAt(0).toUpperCase() +
              automation.status.slice(1)}
          </span>
        </div>
      </div>
      <div className="mt-2">
        <p className="text-sm font-medium">
          Subject: {automation.email_subject}
        </p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {automation.email_body}
        </p>
      </div>
    </div>
  );
}
