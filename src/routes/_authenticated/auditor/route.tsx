import { createFileRoute } from "@tanstack/react-router";

import { PortalLayout } from "@/components/layouts/portal-layout";
import { PORTALS } from "@/lib/roles/role-config";
import { requirePortal } from "@/lib/auth/require-portal";

export const Route = createFileRoute("/_authenticated/auditor")({
  ssr: false,
  beforeLoad: async () => {
    await requirePortal("auditor");
  },
  component: () => <PortalLayout portal={PORTALS["auditor"]} />,
});
