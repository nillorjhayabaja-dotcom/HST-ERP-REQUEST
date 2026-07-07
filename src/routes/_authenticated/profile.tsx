import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — HST" }] }),
  component: ProfilePage,
});

const schema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  employee_no: z.string().trim().max(30).optional().or(z.literal("")),
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["my-roles", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return data?.map((r) => r.role) ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone || null,
          employee_no: values.employee_no || null,
          updated_by: user.id,
        })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    await save.mutateAsync(parsed.data);
    setSaving(false);
  };

  return (
    <div>
      <PageHeader title="My Profile" description="Manage your personal information." />
      <div className="p-6 max-w-2xl space-y-6">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input id="first_name" name="first_name" defaultValue={profile?.first_name ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input id="last_name" name="last_name" defaultValue={profile?.last_name ?? ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email ?? ""} readOnly disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee_no">Employee No.</Label>
                  <Input id="employee_no" name="employee_no" defaultValue={profile?.employee_no ?? ""} />
                </div>
              </div>
              <Button type="submit" disabled={saving}>Save changes</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <h3 className="font-semibold">Assigned Roles</h3>
            <div className="flex flex-wrap gap-2">
              {roles.length === 0 && (
                <span className="text-sm text-muted-foreground">No roles assigned</span>
              )}
              {roles.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center rounded-full border border-gold/40 bg-gold/10 text-gold-foreground/90 dark:text-gold px-2.5 py-0.5 text-xs uppercase tracking-wide"
                >
                  {r.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
