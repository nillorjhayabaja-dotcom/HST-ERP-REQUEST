import { createFileRoute } from "@tanstack/react-router";

import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/employee-portal/assets")({
  ssr: false,
  component: () => (
    <ModuleStub
      title="Assets"
      description="ESS Assets module (framework-wired in next step)."
      module="Assets"
      features={["Borrow assets request", "Track approvals", "View assigned assets"]}
    />
  ),
});
