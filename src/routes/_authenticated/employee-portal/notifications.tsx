import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, Clock, ArrowRight, Inbox } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/employee-portal/notifications")({
  component: NotificationsPage,
});

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

function NotificationsPage() {
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await apiClient.get<any>("/notifications");
      if (response.error) throw new Error(response.error);
      return response.data?.notifications || response.data || [];
    },
  });

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">Stay updated on your requests</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inbox</CardTitle>
                  <CardDescription>
                    {unreadCount > 0
                      ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                      : "All caught up!"}
                  </CardDescription>
                </div>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {notifications && notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
                        !notification.is_read ? "bg-blue-50/50 border-blue-200" : "bg-background"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-2 rounded-full ${
                            !notification.is_read ? "bg-blue-100" : "bg-muted"
                          }`}
                        >
                          <Bell
                            className={`h-4 w-4 ${
                              !notification.is_read ? "text-blue-600" : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p
                                className={`text-sm font-medium ${
                                  !notification.is_read
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {notification.title}
                                {!notification.is_read && (
                                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full ml-2" />
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(notification.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <Inbox className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">No new notifications</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Quick Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Unread</span>
                </div>
                <span className="text-lg font-bold">{unreadCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">Total</span>
                </div>
                <span className="text-lg font-bold">{notifications?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/employee-portal/my-requests">
                <Button variant="outline" className="w-full justify-between">
                  View My Requests
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/employee-portal/dashboard">
                <Button variant="outline" className="w-full justify-between">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
