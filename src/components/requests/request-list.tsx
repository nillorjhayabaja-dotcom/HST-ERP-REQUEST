import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, PriorityBadge } from "./status-badge";
import { Search, ChevronDown, ChevronUp, FileText, RefreshCw, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface RequestListItem {
  id: string;
  control_number: string;
  module: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  summary?: string;
}

interface RequestListProps {
  items: RequestListItem[];
  isLoading?: boolean;
  onItemClick?: (item: RequestListItem) => void;
  onRefresh?: () => void;
  searchPlaceholder?: string;
  className?: string;
  emptyMessage?: string;
  emptyDescription?: string;
}

const MODULES = [
  "gate-pass",
  "leave",
  "mrf",
  "purchase-requests",
  "assets",
  "visitors",
  "vehicles",
] as const;

export function RequestList({
  items,
  isLoading = false,
  onItemClick,
  onRefresh,
  searchPlaceholder = "Search by control number, title...",
  className,
  emptyMessage = "No requests found",
  emptyDescription = "Create a new request to get started.",
}: RequestListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [sortField, setSortField] = useState<"created_at" | "updated_at" | "priority">(
    "created_at",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let result = [...items];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.control_number.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.summary?.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((i) => i.status === statusFilter);
    }

    // Module filter
    if (moduleFilter !== "all") {
      result = result.filter((i) => i.module === moduleFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "priority") {
        const order = { critical: 4, high: 3, normal: 2, low: 1 };
        cmp =
          (order[a.priority as keyof typeof order] || 0) -
          (order[b.priority as keyof typeof order] || 0);
      } else {
        cmp = new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [items, searchQuery, statusFilter, moduleFilter, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {MODULES.map((m) => (
              <SelectItem key={m} value={m}>
                {m.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onRefresh && (
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium">Sort by:</span>
        {(["created_at", "updated_at", "priority"] as const).map((field) => (
          <button
            key={field}
            onClick={() => toggleSort(field)}
            className={cn(
              "flex items-center gap-0.5 px-2 py-0.5 rounded hover:bg-muted transition-colors",
              sortField === field && "bg-muted font-semibold text-foreground",
            )}
          >
            {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            {sortField === field &&
              (sortDir === "asc" ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              ))}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">{emptyMessage}</h3>
            <p className="text-sm text-muted-foreground mt-1">{emptyDescription}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "cursor-pointer transition-colors hover:bg-accent/50",
                onItemClick && "cursor-pointer",
              )}
              onClick={() => onItemClick?.(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {item.control_number}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {item.module}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium truncate">{item.title}</p>
                    {item.summary && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {item.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={item.priority} />
                    <StatusBadge status={item.status} />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                  <span>Updated: {new Date(item.updated_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Count */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {filtered.length} of {items.length} requests
        </p>
      )}
    </div>
  );
}
