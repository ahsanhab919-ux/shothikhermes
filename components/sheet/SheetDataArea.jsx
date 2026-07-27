"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { useCreateSheetMutation } from "@/redux/api/sheet/sheetApi";
import {
  selectActiveChatId,
  selectActiveSavePoint,
  selectSheet,
  selectSheetStatus,
  setSheetData,
  setSheetStatus,
  switchToGeneration,
  switchToSavePoint,
} from "@/redux/slices/sheetSlice";
import {
  rowsToFortuneSheet,
  fortuneSheetToRows,
  exportToCSV,
  exportToXLSX,
} from "@/adapters/fortuneSheetAdapter";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Download,
  Edit,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  Share,
  Table,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ShareSheetModal from "../share/ShareSheetModal";
import SavePointsDropdown from "./SavePointsDropDown";

const Workbook = dynamic(
  () => import("@fortune-sheet/react").then((mod) => mod.Workbook),
  { ssr: false }
);

const StatusChip = ({ status, title, rowCount = 0 }) => {
  const getStatusProps = () => {
    switch (status) {
      case "generating":
        return {
          variant: "secondary",
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: "Generating",
        };
      case "completed":
        return {
          variant: "default",
          icon: <CheckCircle className="h-4 w-4" />,
          label: `Complete (${rowCount} rows)`,
        };
      case "error":
        return {
          variant: "destructive",
          icon: <AlertCircle className="h-4 w-4" />,
          label: "Error",
        };
      case "cancelled":
        return {
          variant: "outline",
          icon: <AlertCircle className="h-4 w-4" />,
          label: "Cancelled",
        };
      default:
        return {
          variant: "outline",
          icon: <Play className="h-4 w-4" />,
          label: "Ready",
        };
    }
  };

  const statusProps = getStatusProps();

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={statusProps.variant}
        className="flex items-center gap-1 font-medium"
      >
        {statusProps.icon}
        {statusProps.label}
      </Badge>
      {title && (
        <p className="text-muted-foreground max-w-[300px] overflow-hidden text-sm text-ellipsis whitespace-nowrap">
          {title}
        </p>
      )}
    </div>
  );
};

export default function SheetDataArea() {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [cssLoaded, setCssLoaded] = useState(false);
  const saveTimerRef = useRef(null);
  const headersRef = useRef([]);
  const rowIdMapRef = useRef({});
  const containerRef = useRef(null);

  const activeChatId = useSelector(selectActiveChatId);
  const sheetState = useSelector((state) => selectSheet(state, activeChatId));
  const sheetStatus = useSelector((state) =>
    selectSheetStatus(state, activeChatId)
  );
  const currentSavePoint = useSelector(selectActiveSavePoint);
  const dispatch = useDispatch();
  const isMobile = useIsMobile();

  const [saveEditedSheetData, { isLoading: isSavingData }] =
    useCreateSheetMutation();

  useEffect(() => {
    import("@fortune-sheet/react/dist/index.css").then(() => setCssLoaded(true)).catch(() => setCssLoaded(true));
  }, []);

  const { fortuneData, headers } = useMemo(() => {
    const result = rowsToFortuneSheet(sheetState.sheet);
    headersRef.current = result.headers;
    rowIdMapRef.current = result.rowIdMap;
    return { fortuneData: result.sheetData, headers: result.headers };
  }, [sheetState.sheet]);

  const hasData =
    sheetState.sheet &&
    Array.isArray(sheetState.sheet) &&
    sheetState.sheet.length > 0;

  const saveToBackend = useCallback(
    async (updatedRows) => {
      try {
        const sp = sheetState.savePoints?.find(
          (s) => s.id === sheetState.activeSavePointId
        );
        if (!sp || !sp.generations?.length) return;

        const activeGen = sp.generations.find(
          (g) => g.id === sp.activeGenerationId
        );
        const conversationId = sp.id.replace("savepoint-", "");

        if (conversationId && activeChatId) {
          const columnOrder = Object.keys(updatedRows[0] || {});
          await saveEditedSheetData({
            chatId: activeChatId,
            conversationId,
            sheetData: updatedRows,
            columnOrder,
            rowOrder: updatedRows.map((row) => row.id),
            metadata: {
              ...activeGen?.metadata,
              lastEdited: new Date().toISOString(),
              editedBy: "user",
              editType: "cell_edit",
            },
            timestamp: new Date().toISOString(),
          }).unwrap();
        }
      } catch (error) {
        console.warn("Changes saved locally only:", error);
      }
    },
    [
      sheetState.savePoints,
      sheetState.activeSavePointId,
      activeChatId,
      saveEditedSheetData,
    ]
  );

  const handleFortuneSheetChange = useCallback(
    (data) => {
      if (!data || !Array.isArray(data) || data.length === 0) return;

      const updatedRows = fortuneSheetToRows(data, headersRef.current, rowIdMapRef.current);
      if (updatedRows.length === 0) return;

      const newIdMap = {};
      updatedRows.forEach((row, idx) => {
        newIdMap[idx + 1] = row.id;
      });
      rowIdMapRef.current = newIdMap;

      dispatch(setSheetData({ chatId: activeChatId, sheet: updatedRows }));

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveToBackend(updatedRows);
      }, 2000);
    },
    [activeChatId, dispatch, saveToBackend]
  );

  const handleExportOption = async (type) => {
    if (!hasData) return;

    if (type === "csv") {
      exportToCSV(sheetState.sheet, headersRef.current);
    } else if (type === "xlsx") {
      await exportToXLSX(sheetState.sheet, headersRef.current);
    }
  };

  const handleRefresh = () => {
    if (!currentSavePoint) return;
    if (sheetStatus === "error") {
      const activeGen = currentSavePoint.generations.find(
        (g) => g.id === currentSavePoint.activeGenerationId
      );
      if (activeGen) {
        dispatch(
          switchToGeneration({
            chatId: activeChatId,
            savePointId: currentSavePoint.id,
            generationId: currentSavePoint.activeGenerationId,
          })
        );
      } else {
        dispatch(setSheetStatus({ chatId: activeChatId, status: "idle" }));
      }
    } else {
      dispatch(
        switchToSavePoint({
          chatId: activeChatId,
          savePointId: currentSavePoint.id,
        })
      );
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (sheetStatus === "generating") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <h2 className="mb-2 text-xl font-semibold">Generating Your Sheet</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Please wait while we process your request...
        </p>
        <Progress value={undefined} className="w-full max-w-md" />
      </div>
    );
  }

  if (sheetStatus === "error") {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="border-border bg-background max-w-md rounded-lg border p-8 text-center shadow-md">
          <AlertCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
          <h2 className="mb-2 text-xl font-semibold">Generation Failed</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Something went wrong while generating your sheet. Please try again.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          {sheetState.savePoints?.length > 0 &&
            sheetState.activeSavePointId && (
              <SavePointsDropdown
                savePoints={sheetState.savePoints || []}
                activeSavePointId={sheetState.activeSavePointId}
                onSavePointChange={(savePoint) => {
                  dispatch(
                    switchToSavePoint({
                      chatId: activeChatId,
                      savePointId: savePoint.id,
                    })
                  );
                }}
                currentSheetData={sheetState.sheet}
              />
            )}
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasData}
                      className="rounded-lg border-2 px-2 transition-all hover:-translate-y-0.5 hover:shadow-md sm:px-4"
                    >
                      <Download className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Export</span>
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExportOption("csv")}>
                      <FileText className="mr-2 h-4 w-4" />
                      <div>
                        <div className="font-medium">Export as CSV</div>
                        <div className="text-muted-foreground text-xs">
                          Normal CSV format
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExportOption("xlsx")}
                    >
                      <Table className="mr-2 h-4 w-4" />
                      <div>
                        <div className="font-medium">Export as Excel</div>
                        <div className="text-muted-foreground text-xs">
                          Microsoft Excel format
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShareModalOpen(true)}
                  disabled={!hasData}
                  className="ml-2 rounded-lg border-2 px-2 transition-all hover:-translate-y-0.5 hover:shadow-md sm:px-4"
                >
                  <Share className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share sheet data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div ref={containerRef} className="fortune-sheet-container min-h-0 flex-1">
        {hasData && cssLoaded && (
          <Workbook
            data={fortuneData}
            onChange={handleFortuneSheetChange}
            showToolbar={!isMobile}
            showFormulaBar={!isMobile}
            showSheetTabs={false}
            allowEdit={true}
            row={50}
            column={26}
          />
        )}
        {!hasData && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No data yet. Use the chat to generate a sheet.
            </p>
          </div>
        )}
      </div>

      <div className="border-border mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-2">
        <span className="text-muted-foreground text-xs">
          {hasData
            ? `${sheetState.sheet?.length || 0} rows × ${headers.length} columns`
            : "Ready"}
        </span>

        <div className="flex items-center gap-4">
          {!isMobile && (
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Edit className="h-3 w-3" />
              Click cells to edit · Formulas supported
            </span>
          )}
          {isSavingData && (
            <span className="text-primary flex items-center gap-1 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving changes...
            </span>
          )}
        </div>
      </div>

      <ShareSheetModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        sheetId={currentSavePoint?.id || "sheet-" + Date.now()}
        sheetData={sheetState.sheet}
        chatId={activeChatId}
      />
    </div>
  );
}
