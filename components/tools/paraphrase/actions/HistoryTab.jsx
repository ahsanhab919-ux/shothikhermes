// HistoryTab.jsx
import { ENV } from "@/config/env";
import { Button } from "@/components/ui/button";
import {
  setActiveHistory,
  setHistories,
  setHistoryGroups,
} from "@/redux/slices/paraphraseHistorySlice";
import { historyGroupsByPeriod } from "@/utils/historyGroupsByPeriod";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCcw,
  Trash2 as Trash,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

const HistoryTab = ({ onClose }) => {
  const dispatch = useDispatch();

  const [expandedEntries, setExpandedEntries] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { accessToken } = useSelector((state) => state.auth);

  const { activeHistory, histories, historyGroups } = useSelector(
    (state) => state.paraphraseHistory,
  );

  const API_BASE =
    ENV.api_url +
    `/${ENV.paraphrase_redirect_prefix}/api`;

  const fetchHistory = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch history");
      }

      const data = await res.json();
      const groups = historyGroupsByPeriod(data || []);

      dispatch(setHistories(data));
      dispatch(setHistoryGroups(groups));
    } catch (err) {
      console.error("Error fetching history:", err);
      toast.error(err.message || "Failed to fetch history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, dispatch, API_BASE]);

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to clear all history?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/history`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete history");
      }

      dispatch(setHistories([]));
      dispatch(setHistoryGroups([]));
      dispatch(setActiveHistory(null));
      toast.success("All history cleared successfully");
    } catch (err) {
      console.error("Error deleting all history:", err);
      toast.error(err.message || "Failed to delete history. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteEntry = useCallback(
    async (entryId) => {
      if (!window.confirm("Are you sure you want to delete this entry?"))
        return;

      setDeletingId(entryId);
      try {
        const res = await fetch(`${API_BASE}/history/${entryId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
        });

        if (!res.ok) {
          throw new Error("Failed to delete history entry");
        }

        // Clear active history if the deleted entry was active
        if (activeHistory && activeHistory._id === entryId) {
          dispatch(setActiveHistory(null));
        }

        // Refetch history from API to ensure data consistency
        // This prevents data structure mismatches that cause empty history
        await fetchHistory();

        toast.success("History entry deleted successfully");
      } catch (err) {
        console.error("Error deleting history entry:", err);
        toast.error(err.message || "Failed to delete entry. Please try again.");
      } finally {
        setDeletingId(null);
      }
    },
    [accessToken, activeHistory, dispatch, API_BASE, fetchHistory],
  );

  const handleSetActiveHistory = (entry) => {
    dispatch(setActiveHistory(entry));
    onClose();
  };

  // Auto-fetch history on mount if accessToken is available
  useEffect(() => {
    if (!accessToken) return;
    // Only fetch if we don't have history data yet
    if (!histories || histories.length === 0) {
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]); // Only depend on accessToken to avoid infinite loops

  useEffect(() => {
    if (!(historyGroups?.length > 0)) return;
    const init = {};
    historyGroups?.forEach((group) => {
      init[group?.period] = true;
    });
    setExpandedGroups(init);
  }, [historyGroups]);

  const toggleGroup = (period) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [period]: !prev?.[period],
    }));
  };

  const toggleEntryExpansion = (period, index) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [`${period}-${index}`]: !prev?.[`${period}-${index}`],
    }));
  };

  return (
    <div id="history_tab" className="px-2 py-1">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between px-2">
        <h6 className="text-lg font-bold">History</h6>
        {accessToken && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={fetchHistory}
              disabled={isLoading}
              className="min-w-0 p-1"
              aria-label="Refresh history"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCcw className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDeleteAll}
              disabled={isDeleting || isLoading}
              className="min-w-0 p-1"
              aria-label="Clear history"
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash className="size-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Period groups */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
          <span className="text-muted-foreground ml-2 text-sm">
            Loading history...
          </span>
        </div>
      ) : historyGroups?.length === 0 ? (
        <p className="text-muted-foreground px-2 text-sm">
          No history entries.
        </p>
      ) : (
        historyGroups?.map(({ period, history }) => (
          <div key={period} className="mb-2">
            <div
              onClick={() => toggleGroup(period)}
              className="mb-1 flex cursor-pointer items-center justify-between px-2"
            >
              <span className="text-muted-foreground text-sm">{period}</span>
              {expandedGroups?.[period] ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="min-w-0 p-1"
                  aria-label="Collapse group"
                >
                  <ChevronUp className="size-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="min-w-0 p-1"
                  aria-label="Expand group"
                >
                  <ChevronDown className="size-4" />
                </Button>
              )}
            </div>
            <div className="border-border border-b" />
            {expandedGroups?.[period] &&
              history?.map((entry, i) => (
                <div
                  key={i}
                  onClick={() => handleSetActiveHistory(entry)}
                  className={`cursor-pointer px-2 pt-1 pb-1 transition-colors ${i < history?.length - 1 ? "border-border border-b" : ""} ${entry?._id === activeHistory?._id ? "bg-primary/10" : "bg-transparent"} `}
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
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEntry(entry._id);
                      }}
                      disabled={deletingId === entry._id || isDeleting}
                      className="text-destructive min-w-0 p-1"
                      aria-label="Delete entry"
                    >
                      {deletingId === entry._id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash className="size-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm">
                    {expandedEntries?.[`${period}-${i}`]
                      ? entry?.text
                      : truncateText(entry?.text, 20)}
                    {entry?.text?.split(" ")?.length > 20 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEntryExpansion(period, i);
                        }}
                        className="ml-1"
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
  );
};

export default HistoryTab;

// HELPER FUNCTION
export function truncateText(text, limit) {
  const words = text?.split(" ");
  if (words?.length > limit) {
    return words?.slice(0, limit).join(" ") + "...";
  }
  return text;
}
