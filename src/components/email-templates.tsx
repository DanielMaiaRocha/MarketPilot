"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { createClient } from "../../supabase/client";

interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export default function EmailTemplates() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
  });

  // Fetch email templates
  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching email templates:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (currentTemplate) {
        // Update existing template
        const { error } = await supabase
          .from("email_templates")
          .update({
            name: formData.name,
            subject: formData.subject,
            body: formData.body,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentTemplate.id);

        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase.from("email_templates").insert({
          name: formData.name,
          subject: formData.subject,
          body: formData.body,
        });

        if (error) throw error;
      }

      // Reset form and close dialog
      setFormData({ name: "", subject: "", body: "" });
      setCurrentTemplate(null);
      setIsDialogOpen(false);
      fetchTemplates();
    } catch (err: any) {
      setError(err.message);
      console.error("Error saving email template:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchTemplates();
    } catch (err: any) {
      setError(err.message);
      console.error("Error deleting email template:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    setCurrentTemplate(null);
    setFormData({ name: "", subject: "", body: "" });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {currentTemplate ? "Edit Template" : "Create Template"}
              </DialogTitle>
              <DialogDescription>
                {currentTemplate
                  ? "Update your email template details below."
                  : "Create a new email template for your automations."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Welcome Email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Welcome to our service!"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Email Body</Label>
                  <Textarea
                    id="body"
                    name="body"
                    value={formData.body}
                    onChange={handleInputChange}
                    placeholder="Dear {{name}},\n\nThank you for signing up..."
                    rows={10}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {{ name }} to insert the lead's name, {{ email }} for
                    their email, etc.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? "Saving..."
                    : currentTemplate
                      ? "Update Template"
                      : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {isLoading && templates.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[200px] animate-pulse bg-muted rounded-lg"
            ></div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No email templates yet
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create your first email template to use in automations.
          </p>
          <div className="mt-6">
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.subject}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm whitespace-pre-wrap line-clamp-4">
                  {template.body}
                </div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Created: {new Date(template.created_at).toLocaleDateString()}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
