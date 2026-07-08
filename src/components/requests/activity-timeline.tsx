import { cn } from "@/lib/utils";
import {
  FileText,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MessageSquare,
  Paperclip,
  LucideIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ActivityEvent {
  id: string;
  type: "created" | "submitted" | "approved" | "rejected" | "commented" | "attached" | "updated" | "cancelled" | "expired";
  description: string;
  actor_name: string;
  created_at: string;
}

const activityIcons: Record<string, LucideIcon> = {
  created: FileText,
  submitted: Mail,
  approved: CheckCircle2,
  rejected: XCircle,
  commented: MessageSquare,
  attached: Paperclip,
  updated: FileText,
  cancelled: XCircle,
  expired: Clock,
};

const activityColors: Record<string, string> = {
  created: "text-blue-600 bg-blue-50 border-blue-200",
  submitted: "text-purple-600 bg-purple-50 border-purple-200",
  approved: "text-emerald-600 bg-emerald-50 border-emerald-200",
  rejected: "text-red-600 bg-red-50 border-red-200",
  commented: "text-gray-600 bg-gray-50 border-gray-200",
  attached: "text-amber-600 bg-amber-50 border-amber-200",
  updated: "text-blue-600 bg-blue-50 border-blue-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
  expired: "text-orange-600 bg-orange-50 border-orange-200",
};

interface ActivityTimelineProps {
  events: ActivityEvent[];
  className?: string;
}

export function ActivityTimeline({ events, className }: ActivityTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground py-4 text-center", className)}>
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, index) => {
        const Icon = activityIcons[event.type] || Clock;
        const color = activityColors[event.type] || activityColors.updated;
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className="relative flex gap-3 pb-3">
            {!isLast && (
              <div className="absolute left-[17px] top-9 bottom-0 w-px bg-border" />
            )}

            <div
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                color
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>

            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium capitalize">
                  {event.type}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {event.description}
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                by {event.actor_name}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}