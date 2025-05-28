import { createClient } from "../../supabase/server";

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
  leadId?: string;
  automationId?: string;
}

/**
 * Send an email using the configured email service
 * This is a placeholder implementation that logs the email and stores it in the database
 * In a production environment, you would integrate with SendGrid, Nodemailer, or another email service
 */
export async function sendEmail(options: EmailOptions) {
  const supabase = await createClient();

  // In a real implementation, you would send the email using SendGrid or Nodemailer
  console.log(
    `Sending email to ${options.to} with subject "${options.subject}"`,
  );
  console.log(`Email body: ${options.body}`);

  // Store the email in the database
  const { data, error } = await supabase.from("email_logs").insert({
    recipient: options.to,
    subject: options.subject,
    body: options.body,
    sender: options.from || "noreply@marketinghub.com",
    lead_id: options.leadId,
    automation_id: options.automationId,
    status: "sent", // In a real implementation, this would be updated based on the email service response
    sent_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error storing email log:", error);
    throw error;
  }

  return { success: true, messageId: data?.[0]?.id };
}

/**
 * Process email automations that are due to be sent
 * This function would be called by a cron job or scheduled task
 */
export async function processEmailAutomations() {
  const supabase = await createClient();

  // Get all active automations
  const { data: automations, error: automationsError } = await supabase
    .from("email_automations")
    .select("*")
    .eq("status", "active");

  if (automationsError) {
    console.error("Error fetching automations:", automationsError);
    return;
  }

  for (const automation of automations || []) {
    try {
      // Process time-based automations
      if (automation.trigger_type === "time") {
        const delayDays = automation.delay_days || 0;

        // Find leads that were created X days ago and haven't received this automation
        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - delayDays);
        const createdDateStr = createdDate.toISOString().split("T")[0];

        const { data: leads, error: leadsError } = await supabase
          .from("leads")
          .select("*")
          .eq("user_id", automation.user_id)
          .gte("created_at", `${createdDateStr}T00:00:00.000Z`)
          .lt("created_at", `${createdDateStr}T23:59:59.999Z`);

        if (leadsError) {
          console.error("Error fetching leads:", leadsError);
          continue;
        }

        for (const lead of leads || []) {
          // Check if this lead has already received this automation
          const { data: existingLogs, error: logsError } = await supabase
            .from("email_logs")
            .select("*")
            .eq("lead_id", lead.id)
            .eq("automation_id", automation.id);

          if (logsError) {
            console.error("Error checking email logs:", logsError);
            continue;
          }

          if (existingLogs && existingLogs.length === 0 && lead.email) {
            // Send the email
            await sendEmail({
              to: lead.email,
              subject: automation.email_subject,
              body: automation.email_body,
              leadId: lead.id,
              automationId: automation.id,
            });
          }
        }
      }

      // Process status-based automations
      else if (automation.trigger_type === "status") {
        // Find leads that have the specified status and haven't received this automation
        const { data: leads, error: leadsError } = await supabase
          .from("leads")
          .select("*")
          .eq("user_id", automation.user_id)
          .eq("status", automation.trigger_status);

        if (leadsError) {
          console.error("Error fetching leads:", leadsError);
          continue;
        }

        for (const lead of leads || []) {
          // Check if this lead has already received this automation
          const { data: existingLogs, error: logsError } = await supabase
            .from("email_logs")
            .select("*")
            .eq("lead_id", lead.id)
            .eq("automation_id", automation.id);

          if (logsError) {
            console.error("Error checking email logs:", logsError);
            continue;
          }

          if (existingLogs && existingLogs.length === 0 && lead.email) {
            // Send the email
            await sendEmail({
              to: lead.email,
              subject: automation.email_subject,
              body: automation.email_body,
              leadId: lead.id,
              automationId: automation.id,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error processing automation ${automation.id}:`, error);
    }
  }
}
