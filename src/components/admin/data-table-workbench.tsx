"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DataTableWorkbenchProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  content: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function DataTableWorkbench({
  title,
  description,
  actions,
  toolbar,
  content,
  footer,
  className,
}: DataTableWorkbenchProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b border-border/70 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </CardHeader>

      {(toolbar || content || footer) && (
        <CardContent className="space-y-6 pt-6">
          {toolbar ? (
            <div className="rounded-[1.4rem] border border-border/70 bg-background/72 p-4">
              {toolbar}
            </div>
          ) : null}

          {content}

          {footer ? <div className="border-t border-border/70 pt-5">{footer}</div> : null}
        </CardContent>
      )}
    </Card>
  );
}
