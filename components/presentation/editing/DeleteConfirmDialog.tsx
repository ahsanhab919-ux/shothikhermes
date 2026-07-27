"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  elementTag: string;
  elementText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Delete Confirmation Dialog
 * User-friendly confirmation before deleting an element
 */
export function DeleteConfirmDialog({
  open,
  elementTag,
  elementText,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  // Truncate text if too long
  const displayText =
    elementText.length > 100
      ? `${elementText.substring(0, 100)}...`
      : elementText || "(empty element)";

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            <AlertDialogTitle>Delete Element?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Are you sure you want to delete this element? This action cannot be
            undone, but you can use Undo (Ctrl/Cmd+Z) to restore it.
          </AlertDialogDescription>
          <div className="bg-muted mt-4 rounded-md p-3 text-sm">
            <div className="text-muted-foreground font-medium">
              Element: <span className="text-foreground">{elementTag}</span>
            </div>
            {elementText && (
              <div className="text-muted-foreground mt-2">
                Content: <span className="text-foreground">{displayText}</span>
              </div>
            )}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
