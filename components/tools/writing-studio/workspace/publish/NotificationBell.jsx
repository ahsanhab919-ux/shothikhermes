"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Search,
  Globe,
  X,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const NOTIF_ICONS = {
  review_started: Search,
  approved: CheckCircle2,
  rejected: XCircle,
  published: Globe,
};

const NOTIF_COLORS = {
  review_started: "text-amber-500 bg-amber-100 dark:bg-amber-900/20",
  approved: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20",
  rejected: "text-red-500 bg-red-100 dark:bg-red-900/20",
  published: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20",
};

export function NotificationBell({ onSelectBook }) {
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id || "";
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  const notifications = useQuery(
    api.books.getUnreadNotifications,
    userId ? { userId } : "skip"
  );

  const markRead = useMutation(api.books.markNotificationsRead);

  const unreadCount = notifications?.length || 0;

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkRead = useCallback(
    async (bookId, notifId) => {
      try {
        await markRead({ bookId, userId, notificationIds: [notifId] });
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    },
    [markRead, userId]
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!notifications) return;
    const byBook = {};
    for (const n of notifications) {
      if (!byBook[n.bookId]) byBook[n.bookId] = [];
      byBook[n.bookId].push(n.notification.id);
    }
    for (const [bookId, ids] of Object.entries(byBook)) {
      try {
        await markRead({ bookId, userId, notificationIds: ids });
      } catch (err) {
        console.error("Failed to mark notifications as read:", err);
      }
    }
  }, [notifications, markRead, userId]);

  if (!userId) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-lg transition-colors",
          isOpen
            ? "bg-brand/10 text-brand"
            : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-brand font-bold hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {unreadCount === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="h-8 w-8 text-zinc-200 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No new notifications</p>
                </div>
              ) : (
                notifications.map((item) => {
                  const Icon = NOTIF_ICONS[item.notification.type] || BookOpen;
                  const colors = NOTIF_COLORS[item.notification.type] || "text-zinc-500 bg-zinc-100 dark:bg-zinc-800";

                  return (
                    <div
                      key={item.notification.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 cursor-pointer"
                      onClick={() => {
                        handleMarkRead(item.bookId, item.notification.id);
                        onSelectBook?.({ _id: item.bookId, title: item.bookTitle });
                        setIsOpen(false);
                      }}
                    >
                      <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", colors)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          {item.notification.message}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-1">
                          {new Date(item.notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(item.bookId, item.notification.id);
                        }}
                        className="text-zinc-300 hover:text-zinc-500 shrink-0"
                        aria-label="Dismiss"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
