import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  KeyRound,
  FileCheck,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: AdminDashboard,
});

interface AdminStats {
  totalUsers: number;
  totalDepartments: number;
  activeRoles: number;
  pendingApprovals: number;
}

function AdminDashboard() {
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["dashboard", "admin"],
    queryFn: async () => {
      const response = await apiClient.get<any>("/dashboard/admin");
      if (response.error) throw new Error(response.error);
      return response.data;
    },
  });

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Departments", value: stats?.totalDepartments || 0, icon: Building2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Active Roles", value: stats?.activeRoles || 0, icon: KeyRound, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Pending Approvals", value: stats?.pendingApprovals || 0, icon: FileCheck, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  const quickActions = [
    { label: "Manage Users", href: "/admin/users", icon: Users, color: "bg-blue-500" },
    { label: "Roles & Permissions", href: "/admin/roles", icon: KeyRound, color: "bg-purple-500" },
    { label: "Departments", href: "/admin/departments", icon: Building2, color: "bg-green-500" },
    { label: "Workflows", href: "/admin/workflows", icon: FileCheck, color: "bg-amber-500" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">System overview and management</p>
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
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used administrative functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="group flex items-center gap-4 p-4 rounded-lg border hover:border-primary/20 hover:shadow-sm transition-all"
              >
                <div className={`p-3 rounded-lg text-white ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">
                    {action.label}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              System Health
            </CardTitle>
            <CardDescription>Current system status and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Database</span>
                <Badge variant="default" className="bg-green-500">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">API Server</span>
                <Badge variant="default" className="bg-green-500">Running</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Authentication</span>
                <Badge variant="default" className="bg-green-500">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest administrative actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                <ShieldCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Administrative actions will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}