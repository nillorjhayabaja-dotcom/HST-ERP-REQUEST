import { createFileRoute } from "@tanstack/react-router";

import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/employee-portal/visitors")({
  ssr: false,
  component: () => (
    <ModuleStub
      title="Visitors"
      description="ESS Visitors module (framework-wired in next step)."
      module="Visitors"
      features={["Create visitor request", "View history", "Track status"]}
    />
  ),
});
