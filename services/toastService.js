import { toast } from "react-toastify";

class ToastService {
  /**
   * Show upload success notification
   */
  uploadSuccess(fileName, onViewHistory) {
    toast.success(
      <div>
        <div className="font-semibold">{fileName}</div>
        <div className="text-sm">File processed successfully!</div>
      </div>,
      {
        onClick: onViewHistory,
        autoClose: 5000,
      },
    );
  }

  /**
   * Show upload error notification
   */
  uploadError(fileName, errorMessage) {
    toast.error(
      <div>
        <div className="font-semibold">{fileName}</div>
        <div className="text-sm">{errorMessage}</div>
      </div>,
      {
        autoClose: 7000,
      },
    );
  }

  /**
   * Show batch completion notification.
   * Handles singular (1 file) and plural (N files) gracefully.
   */
  batchComplete(count, onViewHistory) {
    const heading =
      count === 1 ? "File processed!" : "All files processed!";
    const detail =
      count === 1
        ? "Your file is ready to download"
        : `${count} files ready to download`;

    toast.success(
      <div>
        <div className="font-semibold">{heading}</div>
        <div className="text-sm">{detail}</div>
      </div>,
      {
        onClick: onViewHistory,
        autoClose: 10000,
        closeOnClick: false,
      },
    );
  }

  /**
   * Show validation error
   */
  validationError(message) {
    toast.warning(message, {
      autoClose: 5000,
    });
  }

  /**
   * Show info message
   */
  info(message) {
    toast.info(message, {
      autoClose: 4000,
    });
  }
}

export const toastService = new ToastService();
