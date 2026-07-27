"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useUploadCompletion } from "@/hooks/useUploadCompletion";
import { toggleUpdateFileHistory } from "@/redux/slices/paraphraseHistorySlice";
import {
  addFiles,
  clearCompleted,
  removeFile,
  selectAllFiles,
  selectIsModalOpen,
  selectUploadStats,
  setModalOpen,
  updateFileStatus,
} from "@/redux/slices/uploadQueueSlice";
import { toastService } from "@/services/toastService";
import { uploadService } from "@/services/uploadService";
import { FileURLManager } from "@/utils/paraphrase/fileUploadHelpers";
import {
  generateFileId,
  sanitizeFileName,
  validateFile,
} from "@/utils/paraphrase/fileValidation";
import { UploadQueue } from "@/utils/paraphrase/uploadQueue";
import { CloudUpload, Download } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import UpgradePopover from "./UpgradePopover";

const FREE_LIMIT = 3;
const PAID_LIMIT = 25;

export default function MultipleFileUpload({
  paidUser,
  selectedMode,
  selectedSynonymLevel,
  selectedLang,
  freezeWords = [],
  shouldShowButton = true,
}) {
  const { accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Redux state
  const files = useSelector(selectAllFiles);
  const stats = useSelector(selectUploadStats);
  const isOpen = useSelector(selectIsModalOpen);

  // Local state
  const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);
  const inputRef = useRef(null);

  // Initialize managers
  const urlManager = useRef(new FileURLManager()).current;
  const uploadQueue = useRef(new UploadQueue(3)).current;

  // Hooks
  useUploadCompletion();

  const limit = paidUser ? PAID_LIMIT : FREE_LIMIT;

  // Cleanup on unmount
  useEffect(() => {
    return () => urlManager.revokeAll();
  }, [urlManager]);

  const handleOpen = (event) => {
    if (paidUser) {
      dispatch(setModalOpen(true));
    } else {
      setPopoverAnchorEl(event.currentTarget);
    }
  };

  const handlePopoverClose = () => setPopoverAnchorEl(null);

  const handleClose = () => {
    dispatch(setModalOpen(false));
    // Files persist in Redux
  };

  const handleFilesSelected = async (fileList) => {
    const incoming = Array.from(fileList).slice(0, limit);

    // Validate auth
    try {
      uploadService.validateAuth(accessToken);
    } catch (err) {
      toastService.validationError(err.message);
      return;
    }

    // Validate and prepare files
    const preparedFiles = await Promise.all(
      incoming.map(async (file) => {
        const validation = await validateFile(file);
        const id = generateFileId(file);

        if (!validation.valid) {
          return {
            id,
            fileName: file.name,
            fileSize: file.size,
            status: "error",
            error: validation.errors[0],
            file, // Keep reference for retry
          };
        }

        return {
          id,
          fileName: sanitizeFileName(file.name),
          fileSize: file.size,
          status: "idle",
          mode: selectedMode,
          synonym: selectedSynonymLevel,
          language: selectedLang,
          freezeWords,
          file, // Keep file reference for upload
        };
      }),
    );

    // Add to Redux
    dispatch(addFiles(preparedFiles));

    // Start uploads for valid files
    preparedFiles.forEach((fileItem) => {
      if (fileItem.status === "idle") {
        uploadQueue.add(() => uploadFile(fileItem));
      }
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFilesSelected(e.dataTransfer.files);
  };

  const onDragOver = (e) => e.preventDefault();

  const uploadFile = async (fileItem) => {
    const { id, file, mode, synonym, language, freezeWords } = fileItem;

    // Set status to uploading with initial progress
    dispatch(updateFileStatus({ id, status: "uploading", progress: 0 }));

    try {
      const blob = await uploadService.uploadFile({
        file,
        mode,
        synonym,
        language,
        freezeWords,
        accessToken,
        fileId: id,
        // Progress callback - updates Redux state in real-time
        onProgress: (percentage) => {
          dispatch(
            updateFileStatus({
              id,
              status: "uploading",
              progress: percentage,
            }),
          );
        },
      });

      // Create download URL
      const url = urlManager.create(blob);

      // Update to success
      dispatch(
        updateFileStatus({
          id,
          status: "success",
          progress: 100,
          downloadUrl: url,
        }),
      );

      // Update file history list — the batch completion hook (useUploadCompletion)
      // fires a single toast after ALL files finish, so we don't show one here.
      dispatch(toggleUpdateFileHistory());
    } catch (err) {
      // Update to error
      dispatch(
        updateFileStatus({
          id,
          status: "error",
          progress: 0,
          error: err.message,
        }),
      );

      // Show error toast
      toastService.uploadError(fileItem.fileName, err.message);
    }
  };

  const handleDownload = (file) => {
    if (file.downloadUrl) {
      const link = document.createElement("a");
      link.href = file.downloadUrl;
      link.download = file.fileName;
      link.click();
    }
  };

  const handleRemoveFile = (fileId) => {
    const file = files.find((f) => f.id === fileId);
    if (file?.downloadUrl) {
      urlManager.revoke(file.downloadUrl);
    }
    dispatch(removeFile(fileId));
  };

  const handleClearCompleted = () => {
    // Revoke URLs for completed files
    files
      .filter((f) => f.status === "success" && f.downloadUrl)
      .forEach((f) => urlManager.revoke(f.downloadUrl));

    dispatch(clearCompleted());
  };

  return (
    <>
      <Button
        id="multi_upload_button"
        onClick={handleOpen}
        className={`items-center gap-2 ${shouldShowButton ? "inline-flex" : "hidden"}`}
      >
        <Image
          src="/icons/cloud.svg"
          alt="upload"
          width={16}
          height={16}
          className="h-4 w-4 lg:h-4 lg:w-4"
        />
        <span>Multi Upload Document</span>
      </Button>
      <Button
        id="multi_upload_close_button"
        className={`${shouldShowButton ? "flex" : "hidden"} absolute top-[-9999px] -z-50 opacity-0`}
        onClick={handleClose}
      />
      <Dialog open={isOpen} onOpenChange={(v) => (!v ? handleClose() : null)}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Upload Multiple Documents</DialogTitle>
          </DialogHeader>
          <div
            id="multi_upload_view"
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="border-border mb-2 cursor-pointer rounded-lg border-2 border-dashed p-4 text-center"
            onClick={() => inputRef.current?.click()}
          >
            <CloudUpload className="text-muted-foreground mb-1 inline-block size-8" />
            <div className="text-base font-medium">
              Upload Multiple Documents
            </div>
            <div className="text-muted-foreground mb-1 text-sm">
              Drop files here or <b>browse</b> your machine
            </div>
            <div className="text-muted-foreground text-xs">
              pdf, txt, docx — up to {limit} file{limit > 1 ? "s" : ""} at once
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              hidden
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
          </div>
          <div className="max-h-[300px] min-w-0 space-y-2 overflow-y-auto">
            {files.map((f) => (
              <div key={f.id} className="flex flex-col py-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {f.fileName}
                    </div>
                    <div
                      className={`text-xs ${f.error ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {f.error
                        ? f.error
                        : f.status === "success"
                          ? "Completed"
                          : f.status === "uploading"
                            ? "Uploading…"
                            : ""}
                    </div>
                  </div>
                  {f.status === "success" && f.downloadUrl && (
                    <a
                      href={f.downloadUrl}
                      download={f.fileName}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-md p-2"
                    >
                      <Download className="size-4" />
                    </a>
                  )}
                </div>
                {(f.status === "uploading" || f.status === "success") && (
                  <div className="mt-1">
                    <Progress value={f.progress} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <div className="text-muted-foreground mr-auto pl-1 text-xs">
              {paidUser
                ? `Up to ${PAID_LIMIT} files per batch`
                : `Free users: ${FREE_LIMIT} files per batch`}
            </div>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <UpgradePopover
        anchorEl={popoverAnchorEl}
        onClose={handlePopoverClose}
        message="Unlock document upload and more premium features."
        redirectPath="/pricing?redirect=/paraphrase"
      />
    </>
  );
}
