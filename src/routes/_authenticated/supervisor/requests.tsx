import { createFileRoute } from "@tanstack/react-router";

import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/supervisor/requests")({
  ssr: false,
  component: () => (
    <ModuleStub
      title="Team Requests"
      description="Requests submitted by your direct reports."
      module="Approvals"
      features={[
        "Recommend for approval",
        "Return for revision",
        "Add comments",
        "View team activity",
      ]}
    />
  ),
});
