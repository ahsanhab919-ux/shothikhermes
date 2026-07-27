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
import { Button } from "@/components/ui/button";
import { useDeleteSingleHistoryMutation } from "@/redux/api/humanizeHistory/humanizeHistory";
import { historyGroupsByPeriod } from "@/utils/historyGroupsByPeriod";
import { ChevronDown, ChevronUp, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { truncateText } from "../paraphrase/actions/HistoryTab";

export default function GPTHistoryTab({
  onClose,
  allHumanizeHistory,
  refetchHistory,
  handleHistorySelect,
}) {
  const [expandedEntries, setExpandedEntries] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { accessToken } = useSelector((state) => state.auth);
  
  const [deleteSingleHistory, { isLoading: isDeleteLoading }] =
    useDeleteSingleHistoryMutation();

  // const { data, refetch } = useGetAllHistoryQuery();
  // 
  const groupedData = historyGroupsByPeriod(allHumanizeHistory);

  const toggleEntryExpansion = (period, index) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [`${period}-${index}`]: !prev?.[`${period}-${index}`],
    }));
  };

  const toggleGroup = (period) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [period]: !prev?.[period],
    }));
  };

  const onHistoryClick = (entry) => {
    // 
    handleHistorySelect(entry);
    onClose();
  };

  const handleDeleteClick = (e, entry) => {
    e.stopPropagation();
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete?._id) return;

    setIsDeleting(true);
    try {
      await deleteSingleHistory({ id: entryToDelete._id }).unwrap();
      toast.success("History entry deleted successfully");
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      // Refetch history to update the list
      if (refetchHistory) {
        refetchHistory();
      }
    } catch (error) {
      console.error("Error deleting history entry:", error);
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to delete entry. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  // INFO: This effect is responsible for auto opening|expanding the curent month toggle to see the history data
  useEffect(() => {
    if (groupedData && groupedData.length > 0) {
      const thisMonthGroup = groupedData.find(
        (group) => group.period === "This Month",
      );
      if (thisMonthGroup) {
        setExpandedGroups((prev) => ({
          ...prev,
          "This Month": true,
        }));
      }
    }
  }, []); // no need for dependencies

  return (
    <>
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting && !isDeleteLoading) {
            handleDeleteCancel();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete History Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              disabled={isDeleting || isDeleteLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting || isDeleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting || isDeleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div id="history_tab" className="px-2 py-1">
        {/* header */}
        <div className="mb-2 flex items-center justify-between px-2">
          <h6 className="text-lg font-bold">History</h6>
          {accessToken && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={refetchHistory}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7" /* onClick={handleDeleteAll} */
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

      {/* Period groups */}
      {groupedData?.length === 0 ? (
        <p className="text-muted-foreground px-2 text-sm">
          No history entries.
        </p>
      ) : (
        groupedData?.map(({ period, history }) => (
          <div key={period} className="mb-2">
            <div
              onClick={() => toggleGroup(period)}
              className="mb-1 flex cursor-pointer items-center justify-between px-2"
            >
              <span className="text-muted-foreground text-sm">{period}</span>
              {expandedGroups?.[period] ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
            <div className="border-border border-b" />
            {expandedGroups?.[period] &&
              history?.map((entry, i) => (
                <div
                  key={i}
                  onClick={() => onHistoryClick(entry)}
                  // className={`cursor-pointer px-2 pt-1 pb-1 transition-colors ${i < history?.length - 1 ? "border-border border-b" : ""} ${entry?._id === activeHistory?._id ? "bg-primary/10" : "bg-transparent"} `}
                  className={`border-border cursor-pointer border-b px-2 pt-1 pb-1 transition-colors`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      {new Date(entry.time).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-7 w-7"
                      onClick={(e) => handleDeleteClick(e, entry)}
                      disabled={isDeleting || isDeleteLoading}
                      aria-label="Delete entry"
                    >
                      {(isDeleting || isDeleteLoading) &&
                      entryToDelete?._id === entry._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm">
                    {expandedEntries?.[`${period}-${i}`]
                      ? entry?.text
                      : truncateText(entry?.text, 20)}
                    {entry?.text?.split(" ")?.length > 20 && (
                      <Button
                        variant="link"
                        className="ml-1 h-auto p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEntryExpansion(period, i);
                        }}
                      >
                        {expandedEntries?.[`${period}-${i}`]
                          ? "Read Less"
                          : "Read More"}
                      </Button>
                    )}
                  </p>
                </div>
              ))}
          </div>
        ))
      )}
      </div>
    </>
  );
}
