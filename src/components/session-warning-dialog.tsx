"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_LOGOUT = 5 * 60 * 1000; // Show warning 5 minutes before logout

export function SessionWarningDialog() {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_BEFORE_LOGOUT / 1000);

  const handleIdle = () => {
    // This is called when the full idle timeout is reached
    // The dialog should have already handled the logout
  };

  const handleWarning = () => {
    setShowWarning(true);
    setCountdown(WARNING_BEFORE_LOGOUT / 1000);
  };

  const extendSession = () => {
    setShowWarning(false);
    // Reset the idle timer by triggering a user activity
    window.dispatchEvent(new Event("mousemove"));
  };

  const handleLogout = async () => {
    setShowWarning(false);
    navigate({ to: "/auth", replace: true });
  };

  // Set up idle timeout with warning
  useIdleTimeout(handleIdle, IDLE_TIMEOUT);

  // Set up a separate timer for the warning
  useEffect(() => {
    const warningTimer = setTimeout(() => {
      handleWarning();
    }, IDLE_TIMEOUT - WARNING_BEFORE_LOGOUT);

    return () => clearTimeout(warningTimer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  // Reset countdown when dialog is shown
  useEffect(() => {
    if (showWarning) {
      setCountdown(WARNING_BEFORE_LOGOUT / 1000);
    }
  }, [showWarning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <DialogTitle>Session Expiring Soon</DialogTitle>
          </div>
          <DialogDescription>
            Your session will expire in{" "}
            <span className="font-semibold text-foreground">{formatTime(countdown)}</span> due to
            inactivity. Would you like to extend your session?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
          <Button onClick={extendSession}>Stay Signed In</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
