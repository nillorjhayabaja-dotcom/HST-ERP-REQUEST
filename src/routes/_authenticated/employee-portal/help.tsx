import { createFileRoute } from "@tanstack/react-router";

import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/employee-portal/help")({
  ssr: false,
  component: () => (
    <ModuleStub
      title="Help"
      description="ESS Help Center (static/placeholder)."
      module="Support"
      features={["FAQs", "Contact support", "How to use ESS"]}
    />
  ),
});


