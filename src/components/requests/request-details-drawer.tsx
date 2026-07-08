import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "./status-badge";
import { ApprovalTimeline, type ApprovalStep } from "./approval-timeline";
import { CommentThread, type Comment } from "./comment-thread";
import { AttachmentManager, type Attachment } from "./attachment-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  X,
  FileText,
  ClipboardList,
  Calendar,
  User,
  Building2,
  ExternalLink,
  Loader2,
} from "lucide-react";

export interface RequestDetailField {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
}

interface RequestDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  controlNumber: string;
  status: string;
  priority: string;
  module: string;
  fields: RequestDetailField[];
  approvalSteps?: ApprovalStep[];
  comments?: Comment[];
  attachments?: Attachment[];
  requestId: string;
  requestType: string;
  isLoading?: boolean;
}

export function RequestDetailsDrawer({
  open,
  onClose,
  title,
  description,
  controlNumber,
  status,
  priority,
  module,
  fields,
  approvalSteps,
  comments,
  attachments,
  requestId,
  requestType,
  isLoading = false,
}: RequestDetailsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg truncate">{title}</SheetTitle>
              <SheetDescription className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">
                  {controlNumber}
                </span>
                <span className="text-[10px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {module}
                </span>
              </SheetDescription>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <StatusBadge status={status} />
            <PriorityBadge priority={priority} />
          </div>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="details" className="text-xs">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Details
              </TabsTrigger>
              {approvalSteps && (
                <TabsTrigger value="approval" className="text-xs">
                  <ClipboardList className="h-3.5 w-3.5 mr-1" />
                  Approval
                </TabsTrigger>
              )}
              {comments && (
                <TabsTrigger value="comments" className="text-xs">
                  <User className="h-3.5 w-3.5 mr-1" />
                  Comments
                </TabsTrigger>
              )}
              {attachments && (
                <TabsTrigger value="attachments" className="text-xs">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Attachments
                </TabsTrigger>
              )}
            </TabsList>

            <ScrollArea className="h-[calc(100vh-280px)] pr-4">
              <TabsContent value="details" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fields.map((field, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border bg-card p-3 space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {field.icon}
                        {field.label}
                      </div>
                      <div className="text-sm font-medium">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {approvalSteps && (
                <TabsContent value="approval" className="mt-4">
                  <ApprovalTimeline steps={approvalSteps} />
                </TabsContent>
              )}

              {comments && (
                <TabsContent value="comments" className="mt-4">
                  <CommentThread
                    comments={comments}
                    requestId={requestId}
                    requestType={requestType}
                  />
                </TabsContent>
              )}

              {attachments && (
                <TabsContent value="attachments" className="mt-4">
                  <AttachmentManager
                    attachments={attachments}
                    requestId={requestId}
                    requestType={requestType}
                  />
                </TabsContent>
              )}
            </ScrollArea>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}