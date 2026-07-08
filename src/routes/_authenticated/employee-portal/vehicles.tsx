import { createFileRoute } from "@tanstack/react-router";

import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/employee-portal/vehicles")({
  ssr: false,
  component: () => (
    <ModuleStub
      title="Vehicles"
      description="ESS Vehicles module (framework-wired in next step)."
      module="Vehicles"
      features={["My vehicle requests", "Create new request", "View request history"]}
    />
  ),
});


