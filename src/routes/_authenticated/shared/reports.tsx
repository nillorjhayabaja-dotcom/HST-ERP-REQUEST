import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, FileSpreadsheet, Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/shared/reports")({
  head: () => ({ meta: [{ title: "Reports — HST" }] }),
  component: ReportsPage,
});

const reports = [
  { module: "Gate Pass", freq: "Daily / Weekly / Monthly" },
  { module: "MRF", freq: "Weekly / Monthly" },
  { module: "Leave", freq: "Monthly / Yearly" },
  { module: "Visitors", freq: "Daily / Weekly" },
  { module: "Vehicles", freq: "Monthly" },
  { module: "Assets", freq: "Monthly" },
  { module: "Purchase Requests", freq: "Weekly / Monthly" },
  { module: "Audit Logs", freq: "On demand" },
];

function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate daily, weekly, monthly, and yearly reports across every module."
      />
      <div className="p-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.module}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{r.module}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{r.freq}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> PDF
                </span>
                <span className="inline-flex items-center gap-1">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                </span>
                <span className="inline-flex items-center gap-1">
                  <Printer className="h-3.5 w-3.5" /> Print
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
