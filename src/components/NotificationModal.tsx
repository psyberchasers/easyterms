"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons-pro/core-duotone-rounded";

interface NotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  type?: "info" | "warning" | "success";
}

export function NotificationModal({
  open,
  onOpenChange,
  title,
  message,
  type = "info",
}: NotificationModalProps) {
  const colors = {
    info: {
      border: "border-primary/30",
      bg: "bg-primary/10",
      text: "text-primary",
    },
    warning: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
    },
    success: {
      border: "border-green-500/30",
      bg: "bg-green-500/10",
      text: "text-green-400",
    },
  };

  const colorScheme = colors[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 border ${colorScheme.border} ${colorScheme.bg} flex items-center justify-center`}>
              <HugeiconsIcon icon={InformationCircleIcon} size={20} className={colorScheme.text} />
            </div>
            <DialogTitle className="text-white text-base">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 h-9 text-sm bg-primary hover:bg-primary/90 text-black transition-colors flex items-center justify-center gap-2"
          >
            OK
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
