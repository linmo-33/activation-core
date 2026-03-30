"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionTone = "neutral" | "danger";

const toneStyles: Record<
  ActionTone,
  {
    shell: string;
    iconWrap: string;
    title: string;
    confirmVariant: "default" | "destructive";
  }
> = {
  neutral: {
    shell: "border-border/80 bg-card/95",
    iconWrap: "border-border/80 bg-background text-foreground",
    title: "text-foreground",
    confirmVariant: "default",
  },
  danger: {
    shell: "border-destructive/25 bg-card/95",
    iconWrap: "border-destructive/20 bg-destructive/8 text-destructive",
    title: "text-destructive",
    confirmVariant: "destructive",
  },
};

interface ActionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  icon: ReactNode;
  tone?: ActionTone;
  pending?: boolean;
  disabled?: boolean;
  summary?: ReactNode;
  details?: ReactNode;
  onConfirm: () => void;
}

export function ActionConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText = "取消",
  icon,
  tone = "neutral",
  pending = false,
  disabled = false,
  summary,
  details,
  onConfirm,
}: ActionConfirmDialogProps) {
  const styles = toneStyles[tone];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("overflow-hidden rounded-[2rem] p-0 shadow-[0_36px_70px_-46px_rgba(15,23,42,0.38)]", styles.shell)}>
        <div className="border-b border-border/70 px-7 py-6">
          <DialogHeader className="space-y-4 text-left">
            <div className="flex items-center gap-4">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border", styles.iconWrap)}>
                {icon}
              </div>
              <div className="space-y-2">
                <div className="data-kicker">操作确认</div>
                <DialogTitle className={cn("text-2xl font-semibold tracking-[-0.04em]", styles.title)}>
                  {title}
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="max-w-[42rem] text-sm leading-6 text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-7 py-6">
          {summary ? (
            <div className="rounded-[1.5rem] border border-border/70 bg-background/72 p-5">
              {summary}
            </div>
          ) : null}

          {details ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              {details}
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-border/70 bg-background/52 px-7 py-5 sm:flex-row sm:justify-between sm:space-x-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {cancelText}
          </Button>
          <Button
            variant={styles.confirmVariant}
            onClick={onConfirm}
            disabled={disabled || pending}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
