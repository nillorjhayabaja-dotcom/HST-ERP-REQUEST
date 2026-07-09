import { Loader2 } from "lucide-react";

export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-2xl bg-gold/10" />
          <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-gold" />
        </div>
        <div className="text-sm">{label}</div>
      </div>
    </div>
  );
}
