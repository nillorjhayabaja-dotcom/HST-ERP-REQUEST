import { createFileRoute } from "@tanstack/react-router";

import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/employee-portal/mrf")({
  ssr: false,
  component: () => (
    <ModuleStub
      title="MRF"
      description="ESS MRF module (framework-wired in next step)."
      module="MRF"
      features={["Create MRF request", "Request details drawer", "Approval timeline (read-only)"]}
    />
  ),
});


