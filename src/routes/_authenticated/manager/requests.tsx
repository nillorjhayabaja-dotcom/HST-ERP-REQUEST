import { createFileRoute } from "@tanstack/react-router";

import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/manager/requests")({
  ssr: false,
  component: () => (
    <ModuleStub
      title="Department Requests"
      description="All requests originating from your department."
      module="Approvals"
      features={[
        "Filter by request type",
        "Track approval progress",
        "Delegate approvals",
        "Export activity",
      ]}
    />
  ),
});
