"use client";

import { useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons-pro/core-duotone-rounded";
import { Delete04Icon } from "@hugeicons-pro/core-solid-rounded";
import { Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  title: string;
  versionCount?: number;
  dialogTitle?: string;
  description?: ReactNode;
  warningMessage?: string;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  versionCount = 0,
  dialogTitle = "Delete Contract",
  description,
  warningMessage,
}: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-border max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 border border-red-500/30 bg-red-500/10 flex items-center justify-center">
              <HugeiconsIcon icon={Alert02Icon} size={20} className="text-red-400" />
            </div>
            <DialogTitle className="text-white text-base">{dialogTitle}</DialogTitle>
          </div>
          <DialogDescription className="text-[#878787] text-sm">
            {description || <>Are you sure you want to delete <span className="text-white">{title}</span>?</>}
          </DialogDescription>
        </DialogHeader>

        {(versionCount > 0 || warningMessage) && (
          <div className="border border-red-500/30 bg-red-500/5 p-3 my-2">
            <p className="text-xs text-red-400">
              {warningMessage || `This will permanently delete the original contract and all versions (${versionCount}).`}
            </p>
          </div>
        )}

        <p className="text-xs text-[#525252]">
          This action cannot be undone.
        </p>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => onOpenChange(false)}
            disabled={deleting}
            className="flex-1 h-9 text-sm text-[#878787] hover:text-white border border-border hover:border-[#404040] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 h-9 text-sm bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Delete04Icon} size={16} />
                Delete
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
