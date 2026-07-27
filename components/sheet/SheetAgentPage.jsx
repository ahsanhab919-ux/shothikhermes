"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { useRegisterUserToBetaListMutation } from "@/redux/api/auth/authApi";
import { CheckCircle, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
// import EmailModal from "../home/EmailCollectModal";
import EmailModal from "@/components/(primary-layout)/(home-v2-page)/(home-components)/EmailCollectModal";
import { resetSheetState } from "@/redux/slices/sheetSlice";
import { useDispatch } from "react-redux";
import SheetChatArea from "./SheetChatArea";
import SheetDataArea from "./SheetDataArea";

export default function SheetAgentPage({ specificAgent, sheetId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const isMobile = useIsMobile();
  const dispatch = useDispatch();

  useEffect(() => {
    const initialPrompt = sessionStorage.getItem("initialPrompt");
    if (initialPrompt) {
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        message: initialPrompt,
        timestamp: new Date().toISOString(),
        isOptimistic: true,
      };
      setOptimisticMessages((prev) => [...prev, optimisticMessage]);
      setIsLoading(true);
      sessionStorage.removeItem("initialPrompt");
    }
  }, []);

  const handlePreviewOpen = () => setPreviewOpen(true);
  const handlePreviewClose = () => setPreviewOpen(false);

  useEffect(() => {
    return () => {
      dispatch(resetSheetState());
    };
  }, []);

  return (
    <div className="bg-background text-foreground flex h-[calc(100dvh-50px)] flex-col overflow-hidden lg:h-[calc(100dvh-64px)]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isMobile ? (
          <>
            <div className="flex flex-1 flex-col overflow-hidden">
              <SheetChatArea
                currentAgentType={specificAgent}
                isLoading={isLoading}
                // for mobile preview panel
                handlePreviewOpen={handlePreviewOpen}
              />
            </div>
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogContent className="bg-card h-[80vh] max-h-[80vh] max-w-3xl overflow-hidden p-0">
                <SheetDataArea
                  isLoadings={isLoading}
                  sheetId={sheetId}
                  isMobile={isMobile}
                />
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 overflow-hidden md:grid-cols-2">
            <div className="border-border flex min-h-0 flex-col overflow-hidden border-r">
              <SheetChatArea
                currentAgentType={specificAgent}
                isLoading={isLoading}
              />
            </div>
            <div className="bg-card flex min-h-0 flex-col overflow-hidden">
              <SheetDataArea
                isLoadings={isLoading}
                sheetId={sheetId}
                isMobile={isMobile}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const FooterCta = ({ isMobile, showModal, setShowModal }) => {
  const [
    registerUserForBetaList,
    { isLoading: registerUserProcessing, isError: registerUserError },
  ] = useRegisterUserToBetaListMutation();

  const handleEmailSubmit = async (email) => {
    try {
      const result = await registerUserForBetaList({ email }).unwrap();


      // Success toast
      toast.success("Successfully registered for beta!", {
        description: "We'll be in touch soon.",
      });

      // Close the modal
      setShowModal(false);
    } catch (error) {
      // Error toast
      toast.error("Registration failed", {
        description:
          error?.data?.message || "Registration failed. Please try again.",
      });
    }
  };

  return (
    <>
      <div className="bg-secondary w-full max-w-[1000px] px-4 py-3">
        <div className="mx-auto max-w-7xl">
          <div
            className={`flex w-full flex-wrap items-center justify-between gap-4 ${
              isMobile ? "flex-col items-start" : "flex-row"
            }`}
          >
            {/* Left side - Icon and text */}
            <div className="flex flex-1 items-center gap-3">
              <CheckCircle className="text-primary h-5 w-5 shrink-0" />
              <p className="text-foreground text-sm leading-tight font-medium">
                Shothik task replay completed.
              </p>
            </div>
            {/* Right side - Action buttons */}
            <div
              className={`flex shrink-0 gap-3 ${isMobile ? "w-full" : "w-auto"}`}
            >
              <Button
                // data-umami-event="Modal: Join the waitlist"
                data-rybbit-event="Modal: Join the waitlist"
                onClick={() => {
                  setShowModal(true);
                }}
                className={`bg-primary hover:bg-primary/90 text-primary-foreground min-h-9 rounded-lg px-4 py-2 text-sm font-medium ${
                  isMobile ? "flex-1" : ""
                }`}
              >
                <User className="mr-2 h-4 w-4" />
                Join the waitlist
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* email modal */}
      <EmailModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleEmailSubmit}
      />
    </>
  );
};
