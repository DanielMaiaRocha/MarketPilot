import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import {
  ArrowUpRight,
  CheckCircle2,
  Zap,
  Shield,
  Users,
  Mail,
  BarChart3,
  LineChart,
  PieChart,
  Target,
  Layers,
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke(
    "supabase-functions-get-plans",
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Main Features Section */}
      <section className="py-24 bg-white" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              All-in-One Marketing Solution
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform combines powerful tools to streamline
              your marketing efforts and drive results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* CRM Feature */}
            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-4 p-3 bg-blue-50 inline-block rounded-lg">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">CRM Dashboard</h3>
              <p className="text-gray-600 mb-4">
                Manage your leads and sales pipeline with an intuitive
                drag-and-drop interface.
              </p>
              <ul className="space-y-2">
                {[
                  "Lead management",
                  "Sales pipeline tracking",
                  "Contact organization",
                  "Task automation",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Email Automation Feature */}
            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-4 p-3 bg-blue-50 inline-block rounded-lg">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Email Automation</h3>
              <p className="text-gray-600 mb-4">
                Create, schedule, and analyze email campaigns that convert leads
                into customers.
              </p>
              <ul className="space-y-2">
                {[
                  "Campaign builder",
                  "Automated sequences",
                  "Performance analytics",
                  "A/B testing",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ad Management Feature */}
            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-4 p-3 bg-blue-50 inline-block rounded-lg">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Ad Management</h3>
              <p className="text-gray-600 mb-4">
                Optimize ad performance across Google and Meta platforms with
                actionable insights.
              </p>
              <ul className="space-y-2">
                {[
                  "Cross-platform metrics",
                  "Performance optimization",
                  "Budget management",
                  "ROI tracking",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <div className="bg-white p-4 rounded-xl shadow-lg overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg">
                  <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white flex flex-col justify-center items-center">
                    <h3 className="text-2xl font-bold mb-4">
                      Dashboard Preview
                    </h3>
                    <p className="text-blue-100 mb-6">
                      Interactive analytics dashboard with real-time data
                      visualization
                    </p>
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <LineChart className="w-8 h-8 mb-2 text-white" />
                        <div className="text-sm">Campaign Performance</div>
                      </div>
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <PieChart className="w-8 h-8 mb-2 text-white" />
                        <div className="text-sm">Lead Sources</div>
                      </div>
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <Target className="w-8 h-8 mb-2 text-white" />
                        <div className="text-sm">Conversion Rates</div>
                      </div>
                      <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <Layers className="w-8 h-8 mb-2 text-white" />
                        <div className="text-sm">Sales Pipeline</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold mb-6">
                Powerful Analytics Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                Get a complete view of your marketing performance with our
                intuitive dashboard. Track leads, monitor campaigns, and
                optimize your ad spend—all in one place.
              </p>
              <ul className="space-y-4">
                {[
                  {
                    icon: <Zap className="w-5 h-5" />,
                    title: "Real-time data",
                    description: "See results as they happen with live updates",
                  },
                  {
                    icon: <Shield className="w-5 h-5" />,
                    title: "Secure access",
                    description: "Role-based permissions for your team",
                  },
                  {
                    icon: <CheckCircle2 className="w-5 h-5" />,
                    title: "Custom reports",
                    description:
                      "Create and export reports tailored to your needs",
                  },
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="text-blue-600 p-2 bg-blue-50 rounded-full">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <a
                  href="/sign-up"
                  className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try it for free
                  <ArrowUpRight className="ml-2 w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">3x</div>
              <div className="text-blue-100">Increase in Conversions</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1,000+</div>
              <div className="text-blue-100">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50%</div>
              <div className="text-blue-100">
                Time Saved on Campaign Management
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your marketing needs. Scale as your
              business grows.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that have streamlined their marketing
            efforts with our all-in-one platform.
          </p>
          <a
            href="/sign-up"
            className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Your Free Trial
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
