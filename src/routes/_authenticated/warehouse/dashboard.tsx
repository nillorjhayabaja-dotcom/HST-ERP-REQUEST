import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PORTALS } from "@/lib/roles/role-config";

export const Route = createFileRoute("/_authenticated/warehouse/dashboard")({
  ssr: false,
  component: Dashboard,
});

function Dashboard() {
  const portal = PORTALS["warehouse"];
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Warehouse Officer Dashboard"
        description={`Welcome to the ${portal.label} workspace.`}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {portal.menu.flatMap((g) => g.items).slice(0, 6).map((item) => (
          <Card key={item.url + item.title} className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <item.icon className="h-4 w-4" />
                <CardDescription className="text-[11px] uppercase tracking-wide">
                  Quick access
                </CardDescription>
              </div>
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Open the {item.title} module to continue.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
