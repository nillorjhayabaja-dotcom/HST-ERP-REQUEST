import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/auth-helper";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/complete-profile")({
  ssr: false,
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/auth" });
  },
  component: CompleteProfile,
});

function CompleteProfile() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [emergency, setEmergency] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      toast.error("You must accept the company policies to continue.");
      return;
    }
    setSubmitting(true);
    try {
      // Mock: mark first-login complete on the frontend only
      window.localStorage.removeItem("hst_first_login");
      toast.success("Profile completed");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: "/" as any, replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gold/10 text-gold grid place-items-center mb-2">
            <UserCog className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Welcome to HST Enterprise Portal. Finish setting up your account before continuing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="avatar">Profile Picture</Label>
              <Input id="avatar" type="file" accept="image/*" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 ..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency">Emergency Contact</Label>
                <Input
                  id="emergency"
                  value={emergency}
                  onChange={(e) => setEmergency(e.target.value)}
                  placeholder="Name & phone"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Minimum 8 characters. Use a mix of letters, numbers, and symbols.
              </p>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={accepted}
                onCheckedChange={(v) => setAccepted(v === true)}
                className="mt-0.5"
              />
              <span className="text-muted-foreground">
                I have read and accept the HST company policies, code of conduct, and data
                privacy agreement.
              </span>
            </label>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving…" : "Complete Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
