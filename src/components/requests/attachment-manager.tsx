import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-helper";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Paperclip,
  Upload,
  FileText,
  File,
  Image,
  FileSpreadsheet,
  Loader2,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
  uploaded_by: string;
  url?: string;
}

interface AttachmentManagerProps {
  attachments: Attachment[];
  requestId: string;
  requestType: string;
  readonly?: boolean;
  className?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return Image;
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv"))
    return FileSpreadsheet;
  if (fileType.includes("pdf") || fileType.includes("document") || fileType.includes("text"))
    return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function AttachmentManager({
  attachments,
  requestId,
  requestType,
  readonly = false,
  className,
}: AttachmentManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const response = await apiClient.delete(
        `/${requestType}/${requestId}/attachments/${attachmentId}`
      );
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [requestType, requestId] });
      toast.success("Attachment deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete attachment");
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const token = getAccessToken();
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
        }
      });

      const result = await new Promise<any>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new Error(data?.error || "Upload failed"));
            }
          } catch {
            reject(new Error("Invalid response"));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error")));

        xhr.open("POST", `${API_BASE_URL}/${requestType}/${requestId}/attachments`);
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });

      queryClient.invalidateQueries({ queryKey: [requestType, requestId] });
      toast.success("File uploaded");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Paperclip className="h-4 w-4" />
          Attachments ({attachments?.length || 0})
        </div>
        {!readonly && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              Upload
            </Button>
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1" />
        </div>
      )}

      <Separator />

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {!attachments || attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No attachments yet.</p>
        ) : (
          attachments.map((att) => {
            const Icon = getFileIcon(att.file_type);
            return (
              <div
                key={att.id}
                className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm"
              >
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{att.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(att.file_size)} &middot;{" "}
                    {formatDistanceToNow(new Date(att.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {att.url && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <a href={att.url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  {!readonly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(att.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}