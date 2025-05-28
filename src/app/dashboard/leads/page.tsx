import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { SubscriptionCheck } from "@/components/subscription-check";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LeadForm from "@/components/lead-form";

export default async function LeadsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch all leads for the user
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Group leads by status
  const leadsByStatus: Record<string, any[]> = {};

  leads?.forEach((lead) => {
    const status = lead.status || "new";
    if (!leadsByStatus[status]) {
      leadsByStatus[status] = [];
    }
    leadsByStatus[status].push(lead);
  });

  const statusLabels: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    proposal: "Proposal",
    won: "Won",
    lost: "Lost",
  };

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Lead Management</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Fill out the form below to add a new lead to your CRM.
                </DialogDescription>
              </DialogHeader>
              <LeadForm />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-7 mb-4">
            <TabsTrigger value="all">All ({leads?.length || 0})</TabsTrigger>
            <TabsTrigger value="new">
              New ({leadsByStatus["new"]?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="contacted">
              Contacted ({leadsByStatus["contacted"]?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="qualified">
              Qualified ({leadsByStatus["qualified"]?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="proposal">
              Proposal ({leadsByStatus["proposal"]?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="won">
              Won ({leadsByStatus["won"]?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="lost">
              Lost ({leadsByStatus["lost"]?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {leads?.length ? (
              leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  statusLabels={statusLabels}
                />
              ))
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          {Object.keys(statusLabels).map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {leadsByStatus[status]?.length ? (
                leadsByStatus[status].map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    statusLabels={statusLabels}
                  />
                ))
              ) : (
                <EmptyState status={status} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </SubscriptionCheck>
  );
}

function LeadCard({
  lead,
  statusLabels,
}: {
  lead: any;
  statusLabels: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{lead.name}</CardTitle>
            <CardDescription>
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="hover:underline">
                  {lead.email}
                </a>
              )}
              {lead.email && lead.phone && " • "}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="hover:underline">
                  {lead.phone}
                </a>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Lead</DialogTitle>
                  <DialogDescription>
                    Update the information for this lead.
                  </DialogDescription>
                </DialogHeader>
                <LeadForm lead={lead} />
              </DialogContent>
            </Dialog>

            <form action="/dashboard/leads/delete" method="post">
              <input type="hidden" name="id" value={lead.id} />
              <Button
                variant="outline"
                size="sm"
                type="submit"
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-muted-foreground">
              Created: {new Date(lead.created_at).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(lead.status)}`}
            >
              {statusLabels[lead.status] || lead.status}
            </span>
          </div>
        </div>

        {lead.notes && (
          <div className="mt-4 text-sm">
            <p className="whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ status }: { status?: string }) {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        {status ? `No ${status} leads yet` : "No leads yet"}
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {status
          ? `You don't have any leads in the ${status} status.`
          : "Get started by adding your first lead."}
      </p>
      <div className="mt-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>
                Fill out the form below to add a new lead to your CRM.
              </DialogDescription>
            </DialogHeader>
            <LeadForm />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "contacted":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "qualified":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "proposal":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "won":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300";
    case "lost":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}
