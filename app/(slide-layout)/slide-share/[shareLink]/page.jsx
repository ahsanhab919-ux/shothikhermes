"use client";

import { PresentationMode } from "@/components/presentation/PresentationMode";
import { SlideCard } from "@/components/presentation/SlideCard";
import { usePresentation } from "@/components/slide/context/SlideContextProvider";
import SlidePreviewNavbar from "@/components/slide/SlidePreviewNavbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  useFetchSharedSlidesQuery,
  useTrackViewMutation,
} from "@/redux/api/share/shareApi";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function SharedSlidesPage() {
  const { shareLink } = useParams();
  const { isPresentationOpen, closePresentation } = usePresentation();
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [authError, setAuthError] = useState("");

  const { accessToken } = useSelector((state) => state.auth);

  // Fetch shared presentation data
  const {
    data: sharedData,
    isLoading: sharedLoading,
    error: sharedError,
    refetch,
  } = useFetchSharedSlidesQuery(
    { shareLink, password, accessToken },
    {
      skip: !shareLink,
    },
  );

  // 

  // Mutation to track view
  const [trackView] = useTrackViewMutation();

  // Handle password dialog and share settings
  useEffect(() => {
    if (sharedData?.settings?.password && !passwordDialogOpen && !password) {
      setPasswordDialogOpen(true);
    }

    // Track view if enabled
    if (sharedData?.trackViews && sharedData?.shareId) {
      trackView({ shareId: sharedData.shareId }).catch((err) => {
        console.error("Failed to track view:", err);
      });
    }
  }, [sharedData, trackView, passwordDialogOpen, password]);

  // Handle errors
  useEffect(() => {
    if (sharedError?.data?.error) {
      if (
        sharedError.data.error ===
        "Sign-in required to access this presentation"
      ) {
        setAuthError("Please sign in to view this presentation.");
      } else if (sharedError.data.error === "Invalid password") {
        setPasswordError("Invalid password");
      } else if (sharedError.data.error === "Share link has expired") {
        setAuthError("This share link has expired.");
      } else {
        setAuthError(
          sharedError.data.error || "Error loading shared presentation",
        );
      }
    }
  }, [sharedError]);

  // Handle password submission
  const handlePasswordSubmit = async () => {
    if (!password) {
      setPasswordError("Password is required");
      return;
    }
    setPasswordError("");
    refetch(); // Re-fetch with the provided password
  };

  if (sharedLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2">
        <Spinner className="size-6" />
        <p className="text-foreground">Loading shared presentation...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2">
        <Alert variant="destructive">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
        {authError.includes("sign in") && (
          <Button variant="default" asChild>
            <a href="/login">Sign In</a>
          </Button>
        )}
      </div>
    );
  }

  if (
    !sharedData?.presentation?.slides ||
    sharedData.presentation.slides.length === 0
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2">
        <p className="text-foreground">
          No slides available for this shared presentation
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Navbar */}
      <SlidePreviewNavbar
        slidesData={sharedData.presentation.slides}
        PresentationTitle={sharedData.presentation.title}
        shareSettings={sharedData.settings}
      />

      {/* Presentation Mode */}
      <PresentationMode
        slides={sharedData.presentation.slides.map((slide) => ({
          ...slide,
          htmlContent: slide.body, // Pass HTML content for rendering
        }))}
        open={
          isPresentationOpen && sharedData?.presentation?.slides?.length > 0
        }
        onClose={closePresentation}
      />

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(passwordError && "border-destructive")}
              aria-invalid={!!passwordError}
            />
            {passwordError && (
              <p className="text-destructive text-sm">{passwordError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit} disabled={!password}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="bg-muted/50 flex min-h-screen flex-col items-center px-2 py-4">
        <div className="mb-3 w-full max-w-[90vw] sm:max-w-[60vw]">
          <h1 className="text-foreground mb-2 text-3xl font-bold">
            {sharedData.presentation.title || "Shared Presentation"}
          </h1>
          {sharedData.presentation.slides.map((slide, index) => (
            <SlideCard
              key={slide.slide_index || index}
              slide={{
                ...slide,
                htmlContent: slide.body, // Pass HTML content for rendering
              }}
              index={index}
              totalSlides={sharedData.presentation.slides.length}
            />
          ))}
        </div>
      </div>
    </>
  );
}
