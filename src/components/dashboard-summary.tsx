import { createClient } from "../../supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { UsersIcon, MailIcon, TrendingUpIcon } from "lucide-react";

export async function DashboardSummary({ userId }: { userId: string }) {
  const supabase = await createClient();

  // Get lead counts
  const { data: leadCounts, error: leadError } = await supabase
    .from("leads")
    .select("status", { count: "exact", head: false })
    .eq("user_id", userId);

  // Get lead counts by status
  const { data: leadsByStatus, error: statusError } = await supabase
    .from("leads")
    .select("status")
    .eq("user_id", userId);

  // Calculate counts by status
  const statusCounts =
    leadsByStatus?.reduce((acc: Record<string, number>, lead) => {
      const status = lead.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) || {};

  const totalLeads = leadCounts?.length || 0;
  const newLeads = statusCounts["new"] || 0;
  const qualifiedLeads = statusCounts["qualified"] || 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLeads}</div>
          <p className="text-xs text-muted-foreground">
            {newLeads} new, {qualifiedLeads} qualified
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Upcoming Campaigns
          </CardTitle>
          <MailIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">
            No active email campaigns
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ad Performance</CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">--</div>
          <p className="text-xs text-muted-foreground">
            Connect ad accounts to view metrics
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
