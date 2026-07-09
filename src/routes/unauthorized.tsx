import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { StatusPage } from "@/components/error-pages/status-page";

export const Route = createFileRoute("/unauthorized")({
  ssr: false,
  component: () => (
    <StatusPage
      code="401"
      title="Unauthorized"
      description="You need to sign in to continue. Please authenticate to access the HST Enterprise Portal."
      icon={Lock}
      tone="warn"
      actions={[{ label: "Sign In", to: "/auth" }]}
    />
  ),
});
