import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Mail,
  Timer,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Car,
  Clock,
  Flag,
  LucideIcon,
} from "lucide-react";

const statusVariants = cva("", {
  variants: {
    variant: {
      default: "",
      secondary: "",
      destructive: "",
      outline: "",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface StatusConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
  bg: string;
  icon: LucideIcon;
}

export const REQUEST_STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: {
    label: "Draft",
    variant: "outline",
    color: "text-gray-600",
    bg: "bg-gray-100",
    icon: FileText,
  },
  submitted: {
    label: "Submitted",
    variant: "outline",
    color: "text-blue-600",
    bg: "bg-blue-50",
    icon: Mail,
  },
  pending_supervisor: {
    label: "Pending Supervisor",
    variant: "secondary",
    color: "text-amber-600",
    bg: "bg-amber-50",
    icon: Timer,
  },
  pending_department_head: {
    label: "Pending Dept. Head",
    variant: "secondary",
    color: "text-orange-600",
    bg: "bg-orange-50",
    icon: Building2,
  },
  pending_hr: {
    label: "Pending HR",
    variant: "secondary",
    color: "text-purple-600",
    bg: "bg-purple-50",
    icon: Users,
  },
  pending_security: {
    label: "Pending Security",
    variant: "secondary",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    icon: ShieldCheck,
  },
  approved: {
    label: "Approved",
    variant: "default",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    icon: CheckCircle2,
  },
  released: {
    label: "Released",
    variant: "default",
    color: "text-blue-600",
    bg: "bg-blue-50",
    icon: Car,
  },
  completed: {
    label: "Completed",
    variant: "default",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    color: "text-red-600",
    bg: "bg-red-50",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    variant: "outline",
    color: "text-gray-500",
    bg: "bg-gray-50",
    icon: X,
  },
  expired: {
    label: "Expired",
    variant: "destructive",
    color: "text-red-600",
    bg: "bg-red-50",
    icon: AlertCircle,
  },
};

export const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  critical: { label: "Critical", color: "bg-red-100 text-red-700 border-red-200", icon: Flag },
  high: {
    label: "High",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: AlertCircle,
  },
  normal: { label: "Normal", color: "bg-blue-100 text-blue-700 border-blue-200", icon: FileText },
  low: { label: "Low", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Clock },
};

export function humanizeStatus(status: string): string {
  const config = REQUEST_STATUS_CONFIG[status];
  if (config) return config.label;
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = REQUEST_STATUS_CONFIG[status] || REQUEST_STATUS_CONFIG.draft;
  const Icon = config.icon;
  return (
    <Badge
      variant={config.variant}
      className={`${config.bg} ${config.color} border px-2 py-1 ${className ?? ""}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.color} border px-2 py-1 ${className ?? ""}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
