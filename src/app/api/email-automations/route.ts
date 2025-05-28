import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { sendEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("email_automations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error fetching email automations:", error);
    return NextResponse.json(
      { error: `Failed to fetch email automations: ${error.message}` },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (
      !body.name ||
      !body.trigger_type ||
      !body.email_subject ||
      !body.email_body
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate trigger type specific fields
    if (
      body.trigger_type === "time" &&
      !body.delay_days &&
      body.delay_days !== 0
    ) {
      return NextResponse.json(
        { error: "Missing delay_days for time-based trigger" },
        { status: 400 },
      );
    }

    if (body.trigger_type === "status" && !body.trigger_status) {
      return NextResponse.json(
        { error: "Missing trigger_status for status-based trigger" },
        { status: 400 },
      );
    }

    // Create the automation
    const { data, error } = await supabase
      .from("email_automations")
      .insert({
        user_id: user.id,
        name: body.name,
        trigger_type: body.trigger_type,
        delay_days: body.trigger_type === "time" ? body.delay_days : null,
        trigger_status:
          body.trigger_type === "status" ? body.trigger_status : null,
        email_subject: body.email_subject,
        email_body: body.email_body,
        template_id: body.template_id || null,
        status: body.status || "active",
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;

    return NextResponse.json({ data: data[0] });
  } catch (error: any) {
    console.error("Error creating email automation:", error);
    return NextResponse.json(
      { error: `Failed to create email automation: ${error.message}` },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Missing automation ID" },
        { status: 400 },
      );
    }

    // Check if the automation belongs to the user
    const { data: existingAutomation } = await supabase
      .from("email_automations")
      .select("*")
      .eq("id", body.id)
      .eq("user_id", user.id)
      .single();

    if (!existingAutomation) {
      return NextResponse.json(
        { error: "Automation not found or you don't have permission" },
        { status: 404 },
      );
    }

    // Update the automation
    const { data, error } = await supabase
      .from("email_automations")
      .update({
        name: body.name,
        trigger_type: body.trigger_type,
        delay_days: body.trigger_type === "time" ? body.delay_days : null,
        trigger_status:
          body.trigger_type === "status" ? body.trigger_status : null,
        email_subject: body.email_subject,
        email_body: body.email_body,
        template_id: body.template_id || null,
        status: body.status || "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select();

    if (error) throw error;

    return NextResponse.json({ data: data[0] });
  } catch (error: any) {
    console.error("Error updating email automation:", error);
    return NextResponse.json(
      { error: `Failed to update email automation: ${error.message}` },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing automation ID" },
        { status: 400 },
      );
    }

    // Check if the automation belongs to the user
    const { data: existingAutomation } = await supabase
      .from("email_automations")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existingAutomation) {
      return NextResponse.json(
        { error: "Automation not found or you don't have permission" },
        { status: 404 },
      );
    }

    // Delete the automation
    const { error } = await supabase
      .from("email_automations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting email automation:", error);
    return NextResponse.json(
      { error: `Failed to delete email automation: ${error.message}` },
      { status: 500 },
    );
  }
}

// Endpoint to manually trigger an automation for testing
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.automationId || !body.leadId) {
      return NextResponse.json(
        { error: "Missing automationId or leadId" },
        { status: 400 },
      );
    }

    // Get the automation
    const { data: automation, error: automationError } = await supabase
      .from("email_automations")
      .select("*")
      .eq("id", body.automationId)
      .eq("user_id", user.id)
      .single();

    if (automationError || !automation) {
      return NextResponse.json(
        { error: "Automation not found or you don't have permission" },
        { status: 404 },
      );
    }

    // Get the lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", body.leadId)
      .eq("user_id", user.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: "Lead not found or you don't have permission" },
        { status: 404 },
      );
    }

    if (!lead.email) {
      return NextResponse.json(
        { error: "Lead does not have an email address" },
        { status: 400 },
      );
    }

    // Process template variables
    let subject = automation.email_subject;
    let body = automation.email_body;

    // Replace template variables
    const variables = {
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      status: lead.status || "",
    };

    for (const [key, value] of Object.entries(variables)) {
      subject = subject.replace(new RegExp(`{{${key}}}`, "g"), value);
      body = body.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    // Send the email
    await sendEmail({
      to: lead.email,
      subject,
      body,
      leadId: lead.id,
      automationId: automation.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error triggering email automation:", error);
    return NextResponse.json(
      { error: `Failed to trigger email automation: ${error.message}` },
      { status: 500 },
    );
  }
}
