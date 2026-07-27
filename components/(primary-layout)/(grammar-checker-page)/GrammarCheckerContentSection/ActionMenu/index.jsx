"use client";

import BookIcon from "@/components/icons/BookIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useScreenSize from "@/hooks/ui/useScreenSize";
import {
  ArrowDownToLine,
  FileChartColumn,
  MoreVertical,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

const ActionMenu = ({
  onPreferences,
  onStatistics,
  onDownload,
  onNewSection,
  onOpenSectionbar,
}) => {
  const { width } = useScreenSize();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="More">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={width > 1024 ? "top" : "bottom"}>
        <DropdownMenuItem onClick={onNewSection} className="lg:hidden">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenSectionbar} className="lg:hidden">
          <BookIcon className="mr-2 h-4 w-4" />
          Saved Documents
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPreferences}>
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Preferences
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onStatistics}>
          <FileChartColumn className="mr-2 h-4 w-4" />
          Statistics
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDownload}>
          <ArrowDownToLine className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActionMenu;
