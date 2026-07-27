import { ENV } from "@/config/env";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CircleCheck, Loader2, OctagonX } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useSelector } from "react-redux";

const FeedbackTab = () => {
  // grab user & token from your auth slice
  const { user, accessToken } = useSelector((state) => state.auth);

  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async () => {
    // simple client-side validation
    if (!feedback.trim()) {
      setError("Please write some feedback before submitting.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(
        `${ENV.api_url}/${ENV.paraphrase_redirect_prefix}/api/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ message: feedback }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        // server might return { error: '...' }
        throw new Error(data.error || "Failed to submit feedback.");
      }

      setSuccess("Thank you for your feedback!");
      setFeedback("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="feedback_tab">
      <h6 className="text-lg font-bold">Feedback</h6>
      <p className="mb-4 text-sm font-medium">
        Are you happy with our service?
      </p>
      <p className="mb-6 text-sm">
        What do you think about the paraphrasing tool?
      </p>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <OctagonX className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-primary/50 bg-primary/5 mb-4">
          <CircleCheck className="text-primary size-4" />
          <AlertDescription className="text-primary">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <Textarea
        placeholder="Write feedback..."
        rows={4}
        className="mb-4"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        disabled={loading}
      />

      <Button onClick={handleSubmit} disabled={loading}>
        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
        {loading ? "Submitting..." : "Submit"}
      </Button>

      <div className="mt-6 mb-4 flex justify-center">
        <Image
          src="/moscot.png"
          alt="moscot"
          width={120}
          height={120}
          className="object-contain"
        />
      </div>
    </div>
  );
};

export default FeedbackTab;
