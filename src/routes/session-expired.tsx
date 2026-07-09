import { createFileRoute } from "@tanstack/react-router";
import { Clock } from "lucide-react";

import { StatusPage } from "@/components/error-pages/status-page";

export const Route = createFileRoute("/session-expired")({
  ssr: false,
  component: () => (
    <StatusPage
      code="Session"
      title="Session Expired"
      description="For your security, your session has ended. Please sign in again to continue."
      icon={Clock}
      tone="warn"
      actions={[{ label: "Sign In Again", to: "/auth" }]}
    />
  ),
});
