import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_authenticated/employee/assets")({
  head: () => ({ meta: [{ title: "Assets — HST" }] }),
  component: () => (
    <ModuleStub
      title="Asset Borrowing"
      module="asset_borrow"
      description="Company assets, borrow requests, releases, and returns with barcode support."
      features={["Asset registry", "Borrow request + approval", "Release & return", "Inspection & condition history", "Barcode support", "Reports"]}
    />
  ),
});
