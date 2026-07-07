import { Construction } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ModuleStub({
  title,
  description,
  module,
  features,
}: {
  title: string;
  description: string;
  module: string;
  features: string[];
}) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={<Badge variant="outline">Module: {module}</Badge>}
      />
      <div className="p-6">
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-gold/20 text-gold grid place-items-center">
              <Construction className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Module scaffolded</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                The <span className="font-medium">{title}</span> module is wired into the
                platform. Foundation services (auth, RBAC, approvals, audit,
                notifications) are already available.
              </p>
            </div>
            <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-4">
              {features.map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2 text-sm text-muted-foreground border border-border rounded-md px-3 py-2"
                >
                  <span className="text-gold">◆</span>
                  {f}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
