import { createFileRoute } from "@tanstack/react-router";

import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/employee-portal/leave")({
  ssr: false,
  component: () => (
    <ModuleStub
      title="Leave"
      description="ESS Leave module (framework-wired in next step)."
      module="Leave"
      features={["Create leave request", "Track approval timeline", "See history"]}
    />
  ),
});
