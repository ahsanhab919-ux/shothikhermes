"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { setIsSectionbarOpen } from "@/redux/slices/grammar-checker-slice";
import {
  deleteGrammarSection,
  renameGrammarSection,
} from "@/services/grammar-checker.service";
import {
  BookOpen,
  ChevronsLeft,
  Edit2,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const GrammarSectionbar = ({
  className,
  fetchSections,
  handleNewSection,
  handleSelectSection,
  sectionId,
  setSectionId,
  removeSectionId,
}) => {
  const [downloadingId, setDownloadingId] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const { accessToken } = useSelector((state) => state.auth);

  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const dispatch = useDispatch();
  const {
    sections = [],
    sectionsGroups = [],
    sectionsMeta,
    isSectionLoading,
    isSectionbarOpen,
  } = useSelector((state) => state.grammar_checker);

  // Removed console.log to reduce noise - was causing performance issues

  const { page = 1, limit = 10, total = 0 } = sectionsMeta || {};
  const hasMore = (sections?.length || 0) < total;

  // Sidebar toggles
  const handleCloseSidebar = () => {
    dispatch(setIsSectionbarOpen(false));
    setSearch("");
  };
  const handleNewClick = () => {
    handleNewSection();
    handleCloseSidebar();
  };
  const handleSectionClick = (section) => {
    handleSelectSection(section);
    handleCloseSidebar();
  };

  // Menu handlers
  const handleRenameClick = (event) => {
    event.stopPropagation();

    if (selectedItem) {
      setNewTitle(selectedItem.title || "");
      setRenameDialogOpen(true);
      setOpenDropdownId(null); // Close dropdown when opening rename dialog
    }
  };

  const handleDeleteClick = (event) => {
    event.stopPropagation();

    if (selectedItem) {
      handleDelete(selectedItem._id);
      setOpenDropdownId(null); // Close dropdown after delete
    }
  };

  const handleRenameSubmit = async (event) => {
    event.stopPropagation();

    if (selectedItem && newTitle.trim() && !isRenaming) {
      setIsRenaming(true);
      try {
        await handleRename(selectedItem?._id, newTitle.trim());
        setRenameDialogOpen(false);
        setNewTitle("");
        setSelectedItem(null);
      } catch (err) {
        // Error is already handled in handleRename
      } finally {
        setIsRenaming(false);
      }
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    fetchSections({ page: nextPage, limit, search });
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchLoading(true);
      fetchSections({ reset: true, search }).finally(() =>
        setSearchLoading(false),
      );
    }, 500);

    return () => clearTimeout(timeoutId);
    // Removed fetchSections from deps - it's stable now (doesn't depend on sections)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Download handler
  const handleDownload = async (id, title) => {};

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      await deleteGrammarSection(id);

      if (sectionId === id) removeSectionId();

      await fetchSections({ reset: true, search });
    } catch (err) {
      console.error("Failed to delete section:", err);
    }
  };

  const handleRename = async (id, title) => {
    try {
      await renameGrammarSection(id, { title });
      await fetchSections({ reset: true, search });
    } catch (err) {
      console.error("Failed to rename section:", err);
    }
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const clearSearch = () => {
    setSearch("");
  };
  return (
    <>
      <Sheet open={isSectionbarOpen} onOpenChange={handleCloseSidebar}>
        <SheetContent
          side="left"
          className="w-full p-4 sm:w-60 [&>button.absolute]:hidden"
        >
          <div id="file_history_view" className="flex h-full flex-col">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseSidebar}
                className="h-8 w-8"
              >
                <ChevronsLeft className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleNewClick}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                New
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={handleSearchChange}
                className="pr-9 pl-9"
              />

              <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />

              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Section List / Skeleton */}
            <div className="flex-1 overflow-y-auto">
              {isSectionLoading || searchLoading ? (
                <div className="space-y-2 p-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-muted h-[60px] animate-pulse rounded-md"
                    />
                  ))}
                </div>
              ) : sections?.length > 0 ? (
                <>
                  <ul className="divide-border divide-y">
                    {sections?.map((item) => (
                      <li key={item._id} className="py-1 first:pt-0 last:pb-0">
                        <div
                          onClick={() => handleSectionClick(item)}
                          className={cn(
                            "hover:bg-accent flex cursor-pointer items-center rounded-md px-2 py-1.5 transition-colors",
                            {
                              "bg-primary/15": sectionId === item._id,
                            },
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {item.title || "Unnamed File"}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {formatTime(item.timestamp)}
                            </p>
                          </div>

                          <div className="ml-2 flex shrink-0 items-center gap-1">
                            {downloadingId === item._id && (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            )}
                            <DropdownMenu
                              open={openDropdownId === item._id}
                              onOpenChange={(open) => {
                                if (open) {
                                  setOpenDropdownId(item._id);
                                  setSelectedItem(item);
                                } else {
                                  setOpenDropdownId(null);
                                }
                              }}
                            >
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="z-[1002]"
                              >
                                <DropdownMenuItem onClick={handleRenameClick}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={handleDeleteClick}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Load More Button */}
                  {hasMore && !search && (
                    <div className="my-3 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isSectionLoading}
                        size="sm"
                      >
                        {isSectionLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Read More"
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Search results info */}
                  {search && sections?.length > 0 && (
                    <p className="text-muted-foreground my-2 text-center text-xs">
                      Found {sections?.length} result(s) for ({search})
                    </p>
                  )}
                </>
              ) : (
                <div className="p-4 text-center">
                  <BookOpen className="text-primary mx-auto h-12 w-12" />
                  <p className="text-muted-foreground mt-3 text-sm">
                    {search
                      ? `No documents found for "${search}"`
                      : "All of your stored documents can be found here."}
                  </p>
                  {search && (
                    <Button
                      variant="outline"
                      onClick={clearSearch}
                      className="mt-3"
                      size="sm"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Rename Dialog */}
      <Dialog
        open={renameDialogOpen}
        onOpenChange={(open) => {
          setRenameDialogOpen(open);
          if (!open) {
            // Clear selectedItem when dialog closes
            setSelectedItem(null);
            setNewTitle("");
            setIsRenaming(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTitle.trim() && !isRenaming) {
                  handleRenameSubmit(e);
                }
              }}
              placeholder="Enter new name"
              disabled={isRenaming}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false);
                setSelectedItem(null);
                setNewTitle("");
                setIsRenaming(false);
              }}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameSubmit}
              disabled={!newTitle.trim() || isRenaming}
            >
              {isRenaming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Renaming...
                </>
              ) : (
                "Rename"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GrammarSectionbar;
