import { createFileRoute } from "@tanstack/react-router";

import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/employee-portal/purchase-requests")({
  ssr: false,
  component: () => (
    <ModuleStub
      title="Purchase Requests"
      description="ESS Purchase Requests module (framework-wired in next step)."
      module="Purchase Request"
      features={["Create purchase request", "View approval timeline", "Request history"]}
    />
  ),
});


