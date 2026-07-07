import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "System Settings — HST Admin" }] }),
  component: SettingsAdmin,
});

function SettingsAdmin() {
  return (
    <div>
      <PageHeader title="System Settings" description="Company profile, notification defaults, and platform-wide preferences." />
      <div className="p-6 grid gap-4 md:grid-cols-2">
        <Card><CardContent className="p-6 space-y-2">
          <h3 className="font-semibold">Company Profile</h3>
          <p className="text-sm text-muted-foreground">HS Technologies (Phils.), Inc.</p>
          <p className="text-sm text-muted-foreground">Metal Stamping & Plastic Injection Manufacturing</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 space-y-2">
          <h3 className="font-semibold">Notification Channels</h3>
          <p className="text-sm text-muted-foreground">In-app: <span className="text-success">Active</span></p>
          <p className="text-sm text-muted-foreground">Email: <span className="text-muted-foreground">Not configured</span></p>
          <p className="text-sm text-muted-foreground">MS Teams: <span className="text-muted-foreground">Not configured</span></p>
        </CardContent></Card>
        <Card><CardContent className="p-6 space-y-2">
          <h3 className="font-semibold">Security</h3>
          <p className="text-sm text-muted-foreground">JWT auth · Bcrypt password hashing · Row-level security</p>
          <p className="text-sm text-muted-foreground">HIBP leaked-password protection: enabled</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 space-y-2">
          <h3 className="font-semibold">Backup</h3>
          <p className="text-sm text-muted-foreground">Managed by Cloud infrastructure (daily snapshots).</p>
        </CardContent></Card>
      </div>
    </div>
  );
}
