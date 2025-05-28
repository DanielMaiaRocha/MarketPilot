"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  UserCircle,
  Home,
  Users,
  Mail,
  BarChart3,
  Settings,
  Zap,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardNavbar() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" prefetch className="text-xl font-bold text-blue-600">
            MarketingHub
          </Link>
          <div className="hidden md:flex items-center gap-6 ml-6">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${isActive("/dashboard") && !isActive("/dashboard/leads") && !isActive("/dashboard/reports") && !isActive("/dashboard/automations") ? "text-blue-600" : "text-gray-600"}`}
            >
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </div>
            </Link>
            <Link
              href="/dashboard/leads"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${isActive("/dashboard/leads") ? "text-blue-600" : "text-gray-600"}`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Leads
              </div>
            </Link>
            <Link
              href="/dashboard/reports"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${isActive("/dashboard/reports") ? "text-blue-600" : "text-gray-600"}`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Reports
              </div>
            </Link>
            <Link
              href="/dashboard/automations"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${isActive("/dashboard/automations") ? "text-blue-600" : "text-gray-600"}`}
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Automations
              </div>
            </Link>
            <Link
              href="#"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
            >
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Campaigns
                <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  Soon
                </span>
              </div>
            </Link>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/settings">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/");
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
