import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/employee/visitors")({
  head: () => ({ meta: [{ title: "Visitors — HST" }] }),
  component: () => (
    <ModuleStub
      title="Visitor Management"
      module="visitor"
      description="Visitor registration, badges, and gate history."
      features={["Registration + photo capture", "Host employee & purpose", "QR badge", "Entry/exit tracking", "Visitor history", "Reports"]}
    />
  ),
});
