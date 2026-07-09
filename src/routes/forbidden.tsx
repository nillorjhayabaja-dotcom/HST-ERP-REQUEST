import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { StatusPage } from "@/components/error-pages/status-page";

export const Route = createFileRoute("/forbidden")({
  ssr: false,
  component: () => (
    <StatusPage
      code="403"
      title="Access Denied"
      description="You don't have permission to access this resource. If you believe this is a mistake, contact your system administrator."
      icon={ShieldAlert}
      tone="danger"
      actions={[
        { label: "Return to Dashboard", to: "/" },
        { label: "Contact Support", to: "/employee-portal/help", variant: "outline" },
      ]}
    />
  ),
});
// Keep Link import used to preserve tree
void Link;
