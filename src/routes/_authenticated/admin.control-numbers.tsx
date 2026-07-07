import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/control-numbers")({
  head: () => ({ meta: [{ title: "Control Numbers — HST Admin" }] }),
  component: ControlNumbersAdmin,
});

function ControlNumbersAdmin() {
  const { data = [] } = useQuery({
    queryKey: ["admin-control-numbers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("control_number_settings")
        .select("*")
        .order("module");
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader
        title="Control Number Settings"
        description="Configurable document-numbering scheme used by every module."
      />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Padding</TableHead>
                  <TableHead>Next Sequence</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Sample</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((s) => {
                  const sample = s.format_template
                    .replace("{PREFIX}", s.prefix)
                    .replace("{YEAR}", String(s.year))
                    .replace("{SEQ}", String(s.next_sequence).padStart(s.padding, "0"));
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono uppercase">{s.module}</TableCell>
                      <TableCell>{s.prefix}</TableCell>
                      <TableCell>{s.year}</TableCell>
                      <TableCell>{s.padding}</TableCell>
                      <TableCell className="tabular-nums">{s.next_sequence}</TableCell>
                      <TableCell className="font-mono text-xs">{s.format_template}</TableCell>
                      <TableCell className="font-mono text-xs text-gold">{sample}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
