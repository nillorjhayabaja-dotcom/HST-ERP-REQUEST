import { createFileRoute } from "@tanstack/react-router";
import { AlertOctagon } from "lucide-react";

import { StatusPage } from "@/components/error-pages/status-page";

export const Route = createFileRoute("/server-error")({
  ssr: false,
  component: () => (
    <StatusPage
      code="500"
      title="Server Error"
      description="Something went wrong on our end. Our team has been notified. Please try again in a few minutes."
      icon={AlertOctagon}
      tone="danger"
      actions={[
        { label: "Try Again", onClick: () => window.location.reload() },
        { label: "Go Home", to: "/", variant: "outline" },
      ]}
    />
  ),
});
