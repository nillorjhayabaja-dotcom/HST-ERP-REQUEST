import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Calendar,
  Users,
  Car,
  Package,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/employee-portal/dashboard")({
  component: EmployeeDashboard,
});

interface DashboardStats {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
}

function EmployeeDashboard() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard", "employee"],
    queryFn: async () => {
      const response = await apiClient.get<any>("/dashboard/employee");
      if (response.error) throw new Error(response.error);
      return response.data as DashboardStats;
    },
  });

  const quickAccessItems = [
    { label: "Gate Pass", icon: Car, href: "/employee-portal/gate-passes", color: "bg-blue-500" },
    { label: "Leave", icon: Calendar, href: "/employee-portal/leave", color: "bg-green-500" },
    { label: "MRF", icon: FileText, href: "/employee-portal/mrf", color: "bg-purple-500" },
    { label: "Visitors", icon: Users, href: "/employee-portal/visitors", color: "bg-orange-500" },
    { label: "Vehicles", icon: Car, href: "/employee-portal/vehicles", color: "bg-cyan-500" },
    { label: "Assets", icon: Package, href: "/employee-portal/assets", color: "bg-pink-500" },
    {
      label: "Purchase Req.",
      icon: Building2,
      href: "/employee-portal/purchase-requests",
      color: "bg-indigo-500",
    },
  ];

  const statCards = [
    {
      label: "Total Requests",
      value: stats?.totalRequests || 0,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending",
      value: stats?.pending || 0,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Approved",
      value: stats?.approved || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Rejected",
      value: stats?.rejected || 0,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
        <p className="text-muted-foreground mt-1">Self-service overview and quick access</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={cn("p-3 rounded-full", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>Frequently used modules and services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickAccessItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="group flex items-center gap-4 p-4 rounded-lg border hover:border-primary/20 hover:shadow-sm transition-all"
              >
                <div className={cn("p-3 rounded-lg text-white", item.color)}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">
                    {item.label}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Requests</CardTitle>
                <CardDescription>Your latest submissions</CardDescription>
              </div>
              <Link to="/employee-portal/my-requests">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No recent requests</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first request to get started
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates on your requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No activity recorded yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Activity will appear here when your requests are processed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
