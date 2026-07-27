import { toggleUpdateFileHistory } from "@/redux/slices/paraphraseHistorySlice";
import {
  selectHasActiveUploads,
  selectUploadStats,
} from "@/redux/slices/uploadQueueSlice";
import { toastService } from "@/services/toastService";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

export const useUploadCompletion = () => {
  const dispatch = useDispatch();
  const stats = useSelector(selectUploadStats);
  const hasActiveUploads = useSelector(selectHasActiveUploads);
  const prevHadActiveUploads = useRef(false);

  useEffect(() => {
    // Batch just completed (transition from active to complete)
    if (
      prevHadActiveUploads.current &&
      !hasActiveUploads &&
      stats.completed > 0
    ) {
      toastService.batchComplete(stats.completed, () => {
        // Open file history when toast clicked
        dispatch(toggleUpdateFileHistory());
      });
    }

    prevHadActiveUploads.current = hasActiveUploads;
  }, [hasActiveUploads, dispatch]); // Removed stats.completed from deps
};
