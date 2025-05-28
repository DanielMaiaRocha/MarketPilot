"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { createClient } from "../../supabase/client";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface EmailAutomationFormProps {
  automation?: any;
  onSuccess?: () => void;
}

export default function EmailAutomationForm({
  automation,
  onSuccess,
}: EmailAutomationFormProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [triggerType, setTriggerType] = useState(
    automation?.trigger_type || "time",
  );
  const [formData, setFormData] = useState({
    name: automation?.name || "",
    trigger_type: automation?.trigger_type || "time",
    delay_days: automation?.delay_days?.toString() || "3",
    trigger_status: automation?.trigger_status || "qualified",
    email_subject: automation?.email_subject || "",
    email_body: automation?.email_body || "",
    template_id: automation?.template_id || "",
    status: automation?.status || "active",
  });

  // Fetch email templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from("email_templates")
          .select("id, name, subject, body")
          .order("name");

        if (error) throw error;
        setTemplates(data || []);
      } catch (err: any) {
        console.error("Error fetching email templates:", err);
      }
    };

    fetchTemplates();
  }, []);

  // Update form when template is selected
  useEffect(() => {
    if (formData.template_id) {
      const selectedTemplate = templates.find(
        (t) => t.id === formData.template_id,
      );
      if (selectedTemplate) {
        setFormData((prev) => ({
          ...prev,
          email_subject: selectedTemplate.subject,
          email_body: selectedTemplate.body,
        }));
      }
    }
  }, [formData.template_id, templates]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "trigger_type") {
      setTriggerType(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const automationData = {
        name: formData.name,
        trigger_type: formData.trigger_type,
        delay_days:
          formData.trigger_type === "time"
            ? parseInt(formData.delay_days)
            : null,
        trigger_status:
          formData.trigger_type === "status" ? formData.trigger_status : null,
        email_subject: formData.email_subject,
        email_body: formData.email_body,
        template_id: formData.template_id || null,
        status: formData.status,
      };

      if (automation) {
        // Update existing automation
        const { error } = await supabase
          .from("email_automations")
          .update(automationData)
          .eq("id", automation.id);

        if (error) throw error;
      } else {
        // Create new automation
        const { error } = await supabase
          .from("email_automations")
          .insert(automationData);

        if (error) throw error;
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
      console.error("Error saving automation:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {automation ? "Edit Automation" : "Create Automation"}
        </CardTitle>
        <CardDescription>
          {automation
            ? "Update your email automation settings."
            : "Set up an automated email to be sent to your leads."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Automation Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Follow-up with new leads"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger_type">Trigger Type</Label>
            <Select
              value={formData.trigger_type}
              onValueChange={(value) =>
                handleSelectChange("trigger_type", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select trigger type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">Time-based</SelectItem>
                <SelectItem value="status">Status-based</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {triggerType === "time"
                ? "Send email after a specific number of days"
                : "Send email when lead reaches a specific status"}
            </p>
          </div>

          {triggerType === "time" ? (
            <div className="space-y-2">
              <Label htmlFor="delay_days">Days After Lead Creation</Label>
              <Input
                id="delay_days"
                name="delay_days"
                type="number"
                min="0"
                value={formData.delay_days}
                onChange={handleInputChange}
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="trigger_status">Lead Status</Label>
              <Select
                value={formData.trigger_status}
                onValueChange={(value) =>
                  handleSelectChange("trigger_status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="template_id">Email Template (Optional)</Label>
            <Select
              value={formData.template_id}
              onValueChange={(value) =>
                handleSelectChange("template_id", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template or create custom email" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Custom Email</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_subject">Email Subject</Label>
            <Input
              id="email_subject"
              name="email_subject"
              value={formData.email_subject}
              onChange={handleInputChange}
              placeholder="Follow-up on your inquiry"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_body">Email Body</Label>
            <Textarea
              id="email_body"
              name="email_body"
              value={formData.email_body}
              onChange={handleInputChange}
              placeholder="Dear {{name}},\n\nThank you for your interest..."
              rows={8}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use {{ name }} to insert the lead's name, {{ email }} for their
              email, etc.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : automation
                ? "Update Automation"
                : "Create Automation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
