import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/forbidden")({
  ssr: false,
  component: ForbiddenPage,
});

function ForbiddenPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-semibold">403 Forbidden</h1>
        <p className="text-muted-foreground mt-2">
          You don’t have permission to access this resource.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
          >
            Go to my dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
