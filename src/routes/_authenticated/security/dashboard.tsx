import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DoorOpen,
  QrCode,
  UserCheck,
  UserMinus,
  Clock,
  AlertTriangle,
  Car,
  Users,
  ClipboardList,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/security/dashboard")({
  component: SecurityDashboard,
});

interface SecurityStats {
  pendingRelease: number;
  releasedToday: number;
  activeVisitors: number;
}

function SecurityDashboard() {
  const { data: stats } = useQuery<SecurityStats>({
    queryKey: ["dashboard", "security"],
    queryFn: async () => {
      const response = await apiClient.get<any>("/dashboard/security");
      if (response.error) throw new Error(response.error);
      return response.data;
    },
  });

  const statCards = [
    { label: "Pending Release", value: stats?.pendingRelease || 0, icon: DoorOpen, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Released Today", value: stats?.releasedToday || 0, icon: QrCode, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Active Visitors", value: stats?.activeVisitors || 0, icon: UserCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Pending Returns", value: 0, icon: Clock, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  const quickActions = [
    { label: "Today's Gate Passes", href: "/security/gate-passes/today", icon: ClipboardList, color: "bg-blue-500" },
    { label: "QR Scanner", href: "/security/gate-passes/scanner", icon: QrCode, color: "bg-purple-500" },
    { label: "Visitor Check-in", href: "/security/visitors/check-in", icon: UserCheck, color: "bg-green-500" },
    { label: "Visitor Check-out", href: "/security/visitors/check-out", icon: UserMinus, color: "bg-red-500" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
        <p className="text-muted-foreground mt-1">Gate monitoring and access control</p>
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
          <CardDescription>Frequently used security functions</CardDescription>
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

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-blue-500" />
              Recent Gate Passes
            </CardTitle>
            <CardDescription>Latest gate pass activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No recent gate passes</p>
              <p className="text-xs text-muted-foreground mt-1">
                Gate pass activities will appear here
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alerts & Notifications
            </CardTitle>
            <CardDescription>Security alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No alerts</p>
              <p className="text-xs text-muted-foreground mt-1">
                Security alerts will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}