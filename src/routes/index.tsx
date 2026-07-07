import { createFileRoute, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth-helper";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    if (isAuthenticated()) throw redirect({ to: "/dashboard" });
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});