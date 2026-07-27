"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  useCreateAgentReplicaMutation,
  useLazyVerifySharedAgentQuery,
} from "@/redux/api/shareAgent/shareAgentApi";
import { setShowLoginModal } from "@/redux/slices/auth";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Save,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { DataGrid } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

// Editable Cell Component for shared sheets
const EditableCell = ({
  value,
  onValueChange,
  row,
  column,
  isEditing,
  onEdit,
}) => {
  const [editValue, setEditValue] = useState(value || "");

  useEffect(() => {
    setEditValue(value || "");
  }, [value]);

  const handleSave = () => {
    if (onValueChange) {
      onValueChange(row, column, editValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value || "");
      onEdit && onEdit(null);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="font-inherit w-full border-0 bg-transparent text-inherit outline-none"
      />
    );
  }

  return (
    <span
      onDoubleClick={() => onEdit && onEdit(`${row.id}-${column}`)}
      className="block w-full cursor-pointer"
    >
      {value || ""}
    </span>
  );
};

// Process sheet data for DataGrid
const processSheetData = (sheetData, onCellValueChange, editingCell) => {
  if (!sheetData || sheetData.length === 0) {
    return { columns: [], rows: [] };
  }

  // Get all unique column headers
  const headers = Array.from(
    new Set(sheetData.flatMap((row) => Object.keys(row))),
  );

  // Create columns
  const columns = headers.map((header) => ({
    key: header,
    name: header.charAt(0).toUpperCase() + header.slice(1).replace(/_/g, " "),
    width: Math.max(250, Math.min(350, header.length * 15)),
    resizable: true,
    sortable: true,
    renderCell: (params) => {
      const value = params.row[header];
      const cellKey = `${params.row.id}-${header}`;
      const isEditing = editingCell === cellKey;

      return (
        <EditableCell
          value={value}
          onValueChange={onCellValueChange}
          row={params.row}
          column={header}
          isEditing={isEditing}
          onEdit={(cellKey) => {
            // Handle edit state
          }}
        />
      );
    },
  }));

  // Process rows with proper IDs
  const rows = sheetData.map((row, index) => {
    return {
      ...row,
      id: row.id !== undefined ? row.id : `row-${index}`,
      _index: index,
    };
  });

  return { columns, rows };
};

export default function SharedSheetPage({ params }) {
  const { shareId } = use(params);
  const [sharedData, setSharedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [pendingSaveAction, setPendingSaveAction] = useState(false);
  const { user } = useSelector((state) => state.auth);

  // Ref for horizontal scroll control
  const gridContainerRef = useRef(null);

  // Function to scroll the grid horizontally
  const scrollGrid = (direction) => {
    if (gridContainerRef.current) {
      const scrollAmount = 300; // pixels to scroll
      const currentScroll = gridContainerRef.current.scrollLeft;
      gridContainerRef.current.scrollLeft =
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount;
    }
  };

  // Fallback: try to get user from localStorage if Redux state is not available
  const [localUser, setLocalUser] = useState(null);

  useEffect(() => {
    // Try to get user info from multiple possible locations in localStorage
    const possibleUserKeys = [
      "user",
      "userData",
      "authUser",
      "currentUser",
      "userInfo",
    ];

    for (const key of possibleUserKeys) {
      const userFromStorage = localStorage.getItem(key);
      if (userFromStorage) {
        try {
          const parsedUser = JSON.parse(userFromStorage);
          setLocalUser(parsedUser);
          break; // Use the first valid user found
        } catch (e) {
          console.error(
            `Error parsing user from localStorage key '${key}':`,
            e,
          );
        }
      }
    }

    // Also try to get user ID directly from access token or other sources
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken && !localUser) {
      try {
        // Try to decode JWT token to get user info
        const tokenPayload = JSON.parse(atob(accessToken.split(".")[1]));
        if (tokenPayload && tokenPayload.userId) {
          setLocalUser({ id: tokenPayload.userId, ...tokenPayload });
        }
      } catch (e) {
      }
    }
  }, []);
  const dispatch = useDispatch();
  const router = useRouter();
  const [verifySharedAgent, { isLoading: isVerifying }] =
    useLazyVerifySharedAgentQuery();
  const [createAgentReplica, { isLoading: isReplicating }] =
    useCreateAgentReplicaMutation();

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        setLoading(true);
        const result = await verifySharedAgent({ shareId }).unwrap();


        if (result.success && result.data) {
          setSharedData(result.data);
        } else {
          console.error("No data in response:", result);
          setError("Failed to load shared sheet data");
        }
      } catch (err) {
        console.error("Error fetching shared data:", err);
        setError("Failed to load shared sheet data");
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchSharedData();
    }
  }, [shareId, verifySharedAgent]);

  const handleCellValueChange = (rowObj, column, newValue) => {
    if (!sharedData?.content?.data) return;

    const updatedData = sharedData.content.data.map((row, index) => {
      if (row.id === rowObj.id || index === rowObj._index) {
        return { ...row, [column]: newValue };
      }
      return row;
    });

    setSharedData({
      ...sharedData,
      content: {
        ...sharedData.content,
        data: updatedData,
      },
    });
  };

  const handleSaveAndCopy = async () => {

    // Check if user is authenticated
    const currentUser = user || localUser;
    const accessToken = localStorage.getItem("accessToken");

    // More robust authentication check - user must have either user data OR accessToken
    if (
      !currentUser ||
      (Object.keys(currentUser).length === 0 && !accessToken)
    ) {

      // Set pending flag so we can retry after login
      setPendingSaveAction(true);

      // Show login modal
      dispatch(setShowLoginModal(true));

      // Show info message
      showSnackbar("Please log in to save this sheet to your account", "info");
      return;
    }


    try {
      // Extract chat ObjectId from shared data
      // The correct path is: sharedData.agent.metadata.chatId (or originalChatId)
      let chatId =
        sharedData?.agent?.metadata?.chatId ||
        sharedData?.agent?.metadata?.originalChatId;


      // Validate that we have a valid MongoDB ObjectId
      const isValidObjectId = chatId && /^[0-9a-fA-F]{24}$/.test(chatId);

      if (!chatId || !isValidObjectId) {
        console.error("❌ Invalid or missing chat ID");
        console.error(
          "sharedData.agent.metadata:",
          sharedData?.agent?.metadata,
        );
        showSnackbar(
          "Unable to find the original chat ID. This link may be invalid.",
          "error",
        );
        return;
      }


      // Get user ID
      let userId =
        currentUser?.id ||
        currentUser?.userId ||
        currentUser?._id ||
        currentUser?.user_id;

      // Try to get user ID from access token if not found
      if (!userId) {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
          try {
            const tokenPayload = JSON.parse(atob(accessToken.split(".")[1]));
            userId = tokenPayload.userId || tokenPayload.id || tokenPayload.sub;
          } catch (e) {
            console.error("Could not decode access token:", e);
          }
        }
      }

      if (!userId) {
        console.error("User ID is missing");
        showSnackbar("User ID is missing. Please log in again.", "error");
        return;
      }


      // Get base URL from environment
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!baseUrl) {
        console.error(
          "API base URL not configured - NEXT_PUBLIC_API_URL is missing",
        );
        showSnackbar("Configuration error. Please contact support.", "error");
        return;
      }

      // Construct the API URL
      // NEXT_PUBLIC_API_URL = https://api-qa.shothik.ai
      // We need to add: /sheet/chat/replicate_chat
      // Remove trailing slash if present
      const cleanBaseUrl = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;
      const apiUrl = `${cleanBaseUrl}/${process.env.NEXT_PUBLIC_SHEET_REDIRECT_PREFIX}/chat/replicate_chat`;

      // Prepare the request payload
      const requestPayload = {
        chat: chatId,
        replicate_to: userId,
      };

      const accessToken = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: await response.text() };
        }
        console.error("❌ API Error Response:", errorData);
        console.error("❌ Response Headers:", [...response.headers.entries()]);
        showSnackbar(
          errorData.message ||
            `Failed to save sheet (${response.status}). Please try again.`,
          "error",
        );
        return;
      }

      const result = await response.json();

      // Show success message
      showSnackbar(
        "Sheet saved to your account successfully! Redirecting...",
        "success",
      );

      // Redirect to the replicated chat page after a short delay
      setTimeout(() => {
        const replicatedChatId =
          result.data?.replicatedChatId || result.replicatedChatId || chatId;

        // Redirect to the agents sheets page with the replicated chat ID
        const redirectUrl = `/agents/sheets?id=${replicatedChatId}`;

        window.location.href = redirectUrl;
      }, 1500);
    } catch (err) {
      console.error("Error creating replica:", err);
      showSnackbar("Failed to create a copy. Please try again.", "error");
    }
  };

  // Watch for user login and retry save action if pending
  useEffect(() => {
    const currentUser = user || localUser;
    const accessToken = localStorage.getItem("accessToken");

    // If user just logged in and there's a pending save action
    if (pendingSaveAction && (currentUser || accessToken)) {
      setPendingSaveAction(false);
      // Retry the save action
      setTimeout(() => {
        handleSaveAndCopy();
      }, 500); // Small delay to ensure auth state is fully updated
    }
  }, [user, localUser, pendingSaveAction]);

  const handleExportCSV = () => {
    if (!sharedData?.content?.data) return;

    const csvContent = convertToCSV(sharedData.content.data);
    downloadFile(csvContent, "shared-sheet.csv", "text/csv");
  };

  const handleExportExcel = async () => {
    if (!sharedData?.content?.data) return;

    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(sharedData.content.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet Data");
    XLSX.writeFile(wb, "shared-sheet.xlsx");
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(","),
      ),
    ];
    return csvRows.join("\n");
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const showSnackbar = (message, severity = "success") => {
    if (severity === "error") {
      toast.error(message);
    } else if (severity === "info") {
      toast.info(message);
    } else {
      toast.success(message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Spinner className="size-12" />
        <p className="text-muted-foreground">Loading shared sheet...</p>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error || "Sheet not found or access denied"}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="ml-4"
            >
              Go Home
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Try different possible data structures
  let sheetData = [];
  let dataSource = "none";

  // Check all possible paths for the data
  if (
    sharedData?.agent?.response?.data &&
    Array.isArray(sharedData.agent.response.data)
  ) {
    sheetData = sharedData.agent.response.data;
    dataSource = "sharedData.agent.response.data";
  } else if (
    sharedData?.agent?.response &&
    Array.isArray(sharedData.agent.response)
  ) {
    sheetData = sharedData.agent.response;
    dataSource = "sharedData.agent.response";
  } else if (
    sharedData?.agent?.content?.data &&
    Array.isArray(sharedData.agent.content.data)
  ) {
    sheetData = sharedData.agent.content.data;
    dataSource = "sharedData.agent.content.data";
  } else if (sharedData?.agent?.data && Array.isArray(sharedData.agent.data)) {
    sheetData = sharedData.agent.data;
    dataSource = "sharedData.agent.data";
  } else if (
    sharedData?.content?.data &&
    Array.isArray(sharedData.content.data)
  ) {
    sheetData = sharedData.content.data;
    dataSource = "sharedData.content.data";
  } else if (sharedData?.data && Array.isArray(sharedData.data)) {
    sheetData = sharedData.data;
    dataSource = "sharedData.data";
  } else if (Array.isArray(sharedData)) {
    sheetData = sharedData;
    dataSource = "sharedData (array)";
  } else if (sharedData?.content && Array.isArray(sharedData.content)) {
    sheetData = sharedData.content;
    dataSource = "sharedData.content";
  } else if (
    sharedData?.response?.rows &&
    Array.isArray(sharedData.response.rows)
  ) {
    sheetData = sharedData.response.rows;
    dataSource = "sharedData.response.rows";
  } else if (sharedData?.rows && Array.isArray(sharedData.rows)) {
    sheetData = sharedData.rows;
    dataSource = "sharedData.rows";
  }

  // If no data found, show message instead of mock data
  if (sheetData.length === 0) {
  } else {
  }

  const { columns, rows } = processSheetData(
    sheetData,
    handleCellValueChange,
    editingCell,
  );
  const hasData = rows.length > 0 && columns.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Home
        </Button>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <h1 className="mb-2 text-2xl font-semibold">
                  {sharedData?.agent?.title || "Shared Sheet"}
                </h1>
                {sharedData?.shareInfo?.sharedBy && (
                  <div className="mb-2 flex items-center gap-2">
                    <User className="text-muted-foreground size-4" />
                    <p className="text-muted-foreground text-sm">
                      Shared by:{" "}
                      {sharedData.shareInfo.sharedBy.name ||
                        sharedData.shareInfo.sharedBy}
                    </p>
                  </div>
                )}
                {sharedData?.shareInfo?.message && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      {sharedData.shareInfo.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {sharedData?.shareInfo?.visibility && (
                  <Badge
                    variant={
                      sharedData.shareInfo.visibility === "public"
                        ? "default"
                        : "outline"
                    }
                  >
                    <Eye className="mr-1 size-3" />
                    {sharedData.shareInfo.visibility}
                  </Badge>
                )}
                {sharedData?.shareInfo?.views !== null &&
                  sharedData?.shareInfo?.views !== undefined && (
                    <Badge variant="outline">
                      {sharedData.shareInfo.views} views
                    </Badge>
                  )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-2">
              {/* <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">
                      <Edit className="mr-2 size-4" />
                      Edit Mode
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle edit mode – Double-click cells to edit</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider> */}

              {/* <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">
                      <ExternalLink className="mr-2 size-4" />
                      View in New Window
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open sheet in a new window</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider> */}

              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={!hasData}>
                    <Download className="mr-2 size-4" />
                    Export
                    <ChevronDown className="ml-1 size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <Download className="mr-2 size-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <Download className="mr-2 size-4" />
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}

              {/* <Button variant="outline">
                <Share2 className="mr-2 size-4" />
                Share
              </Button> */}

              {/* Save and Copy Button */}
              <Button
                variant="default"
                onClick={handleSaveAndCopy}
                disabled={isReplicating}
              >
                {isReplicating ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Save as Copy to My Chat
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <div className="flex h-[calc(100vh-300px)] min-h-[500px] flex-col">
        {hasData ? (
          <>
            <style jsx global>{`
              .shared-sheet-grid .rdg-header-row {
                background-color: #f1f5f9 !important;
              }
              .shared-sheet-grid .rdg-cell {
                background-color: #ffffff;
              }
              .shared-sheet-grid .rdg-row:hover .rdg-cell {
                background-color: #f8fafc;
              }
              .dark .shared-sheet-grid .rdg-header-row {
                background-color: #0f172a !important;
              }
              .dark .shared-sheet-grid .rdg-cell {
                background-color: #020617;
                color: #f9fafb;
              }
              .dark .shared-sheet-grid .rdg-row:hover .rdg-cell {
                background-color: #0f172a;
              }
              .dark .shared-sheet-grid {
                background-color: #020617;
                color: #f9fafb;
              }
              .shared-sheet-grid {
                // height: 100% !important;
              }
              .jsx-3026696ba62a1e57 {
                overflow: visible !important;
              }
              .jsx-504e7d6860aedc15 .h-full .overflow-x-auto {
                height: 10px;
              }
            `}</style>

            {/* Grid Container with Side Arrows */}
            <div className="flex w-full flex-1 items-center gap-2">
              {/* Left Arrow */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollGrid("left")}
                className="hover:bg-muted h-12 w-10 shrink-0 rounded-lg"
              >
                <ChevronLeft className="size-5" />
              </Button>

              {/* Grid */}
              <div className="border-border h-full flex-1 overflow-hidden rounded-lg border">
                <div
                  ref={gridContainerRef}
                  className="h-full overflow-x-auto"
                  style={{ scrollBehavior: "smooth" }}
                >
                  <DataGrid
                    rows={rows}
                    columns={columns}
                    defaultColumnOptions={{
                      resizable: true,
                      sortable: true,
                    }}
                    className="shared-sheet-grid rdg-light bg-white dark:bg-slate-950"
                    style={{
                      fontFamily: "inherit",
                      // height: "100%",
                      minWidth: columns.length * 200,
                    }}
                    headerRowHeight={40}
                    rowHeight={40}
                  />
                </div>
              </div>

              {/* Right Arrow */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollGrid("right")}
                className="hover:bg-muted h-12 w-10 shrink-0 rounded-lg"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </>
        ) : (
          <div className="bg-background border-border flex h-full flex-col items-center justify-center gap-2 rounded-lg border">
            <h3 className="text-muted-foreground text-lg">No data available</h3>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-muted-foreground text-xs">
          {sharedData?.shareInfo?.createdAt
            ? `Shared on ${new Date(sharedData.shareInfo.createdAt).toLocaleDateString()} via Shothik AI`
            : `Last updated: ${new Date().toLocaleTimeString()} via Shothik AI`}
        </p>
        <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1 text-xs">
          <Edit className="size-3" />
          Double-click to edit cells
        </p>
      </div>
    </div>
  );
}
