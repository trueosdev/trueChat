import { X, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/services/attachments";

interface FilePreviewProps {
  file: File;
  previewUrl: string | null;
  onRemove: () => void;
  disabled?: boolean;
}

export function FilePreview({ file, previewUrl, onRemove, disabled }: FilePreviewProps) {
  return (
    <div className="absolute bottom-full left-2 right-2 mb-2 bg-white dark:bg-gray-950 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in slide-in-from-bottom-2">
      {previewUrl ? (
        // Image preview
        <div className="relative">
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <img
              src={previewUrl}
              alt={file.name}
              className="rounded-lg w-full h-auto object-contain shadow-sm"
              style={{ maxHeight: '200px' }}
            />
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                {file.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 shrink-0 hover:bg-red-100 dark:hover:bg-red-900/20"
              disabled={disabled}
            >
              <X className="h-4 w-4 text-red-600 dark:text-red-400" />
            </Button>
          </div>
        </div>
      ) : (
        // File preview (non-image)
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 rounded-lg shadow-sm">
              <Paperclip className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                {file.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 shrink-0 hover:bg-red-100 dark:hover:bg-red-900/20"
            disabled={disabled}
          >
            <X className="h-4 w-4 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      )}
    </div>
  );
}

