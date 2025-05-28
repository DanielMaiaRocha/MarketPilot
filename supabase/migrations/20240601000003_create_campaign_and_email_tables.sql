-- Create campaign_data table
CREATE TABLE IF NOT EXISTS public.campaign_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    campaign_name TEXT NOT NULL,
    date DATE NOT NULL,
    spend DECIMAL(10, 2) NOT NULL,
    clicks INTEGER NOT NULL,
    impressions INTEGER NOT NULL,
    conversions INTEGER NOT NULL,
    cpc DECIMAL(10, 2) NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on campaign_data
ALTER TABLE public.campaign_data ENABLE ROW LEVEL SECURITY;

-- Create policy for campaign_data
DROP POLICY IF EXISTS "Users can only access their own campaign data" ON public.campaign_data;
CREATE POLICY "Users can only access their own campaign data"
    ON public.campaign_data
    FOR ALL
    USING (auth.uid() = user_id);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for email_templates
DROP POLICY IF EXISTS "Users can only access their own email templates" ON public.email_templates;
CREATE POLICY "Users can only access their own email templates"
    ON public.email_templates
    FOR ALL
    USING (auth.uid() = user_id);

-- Create email_automations table
CREATE TABLE IF NOT EXISTS public.email_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    delay_days INTEGER,
    trigger_status TEXT,
    email_subject TEXT NOT NULL,
    email_body TEXT NOT NULL,
    template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on email_automations
ALTER TABLE public.email_automations ENABLE ROW LEVEL SECURITY;

-- Create policy for email_automations
DROP POLICY IF EXISTS "Users can only access their own email automations" ON public.email_automations;
CREATE POLICY "Users can only access their own email automations"
    ON public.email_automations
    FOR ALL
    USING (auth.uid() = user_id);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sender TEXT NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    automation_id UUID REFERENCES public.email_automations(id) ON DELETE SET NULL,
    status TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for email_logs
DROP POLICY IF EXISTS "Users can only access their own email logs" ON public.email_logs;
CREATE POLICY "Users can only access their own email logs"
    ON public.email_logs
    FOR ALL
    USING (
        lead_id IN (
            SELECT id FROM public.leads WHERE user_id = auth.uid()
        ) OR 
        automation_id IN (
            SELECT id FROM public.email_automations WHERE user_id = auth.uid()
        )
    );

-- Add realtime support
alter publication supabase_realtime add table public.campaign_data;
alter publication supabase_realtime add table public.email_templates;
alter publication supabase_realtime add table public.email_automations;
alter publication supabase_realtime add table public.email_logs;
