"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sanitizeHtml } from "@/lib/sanitize";
import { Copy, Download } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const SharedContentPage = () => {
  const params = useParams();
  const { contentType, shareId } = params;

  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadShareData = () => {
      try {
        setLoading(true);

        // First, check sessionStorage for client-side shared data
        const sessionData = sessionStorage.getItem(`share_${shareId}`);
        if (sessionData) {
          try {
            const parsedData = JSON.parse(sessionData);
            setShareData(parsedData);
            setLoading(false);
            return;
          } catch (parseError) {
          }
        }

        // Try to fetch from backend
        const fetchFromBackend = async () => {
          try {
            const response = await fetch(`/api/share/${shareId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              const result = await response.json();
              setShareData(result.data);
            } else {
              throw new Error("Failed to fetch share data");
            }
          } catch (backendError) {

            // Fallback to demo data if backend fails
            const demoData = {
              shareId: shareId,
              contentType: contentType || "research",
              content: {
                title: "Sample Research: The Future of AI in Healthcare",
                query:
                  "What are the latest developments in AI healthcare applications?",
                content: `
# The Future of AI in Healthcare

## Introduction
Artificial Intelligence is revolutionizing healthcare with unprecedented speed and accuracy. This research explores the latest developments and their implications.

## Key Findings

### 1. Diagnostic Accuracy
AI systems are now achieving diagnostic accuracy rates of 95%+ in various medical imaging tasks, surpassing human radiologists in many cases.

### 2. Drug Discovery
Machine learning algorithms are accelerating drug discovery processes, reducing development time from years to months.

### 3. Personalized Medicine
AI enables personalized treatment plans based on individual patient data, genetic profiles, and lifestyle factors.

## Challenges and Considerations

- **Data Privacy**: Ensuring patient data security while leveraging AI capabilities
- **Regulatory Compliance**: Navigating complex healthcare regulations
- **Integration**: Seamlessly integrating AI tools into existing healthcare workflows

## Conclusion
The future of healthcare lies in the successful integration of AI technologies, but it requires careful consideration of ethical, legal, and technical challenges.
                `,
                sources: [
                  {
                    title:
                      "AI in Healthcare: Current Applications and Future Prospects",
                    url: "https://example.com/ai-healthcare-2024",
                    resolved_url: "https://example.com/ai-healthcare-2024",
                  },
                  {
                    title: "Machine Learning in Medical Diagnosis",
                    url: "https://example.com/ml-medical-diagnosis",
                    resolved_url: "https://example.com/ml-medical-diagnosis",
                  },
                  {
                    title: "The Ethics of AI in Healthcare",
                    url: "https://example.com/ai-healthcare-ethics",
                    resolved_url: "https://example.com/ai-healthcare-ethics",
                  },
                ],
              },
              metadata: {
                title: "Sample Research: The Future of AI in Healthcare",
                description:
                  "A comprehensive research report on AI applications in healthcare",
                tags: ["AI", "Healthcare", "Technology", "Research"],
                createdAt: new Date().toISOString(),
              },
              permissions: {
                isPublic: true,
                allowDownload: true,
                allowComments: false,
              },
              currentViews: 42,
              createdAt: new Date().toISOString(),
            };

            setShareData(demoData);
          }
        };

        fetchFromBackend();
      } catch (err) {
        console.error("Error loading share data:", err);
        setError("Failed to load shared content");
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      loadShareData();
    }
  }, [shareId, contentType]);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = window.location.href;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (success) {
          alert("Link copied to clipboard!");
        }
      }
    } catch (error) {
      console.error("Failed to copy link:", error);
      alert("Failed to copy link");
    }
  };

  const handleDownload = () => {
    if (!shareData?.content) return;

    try {
      const element = document.createElement("a");
      const content =
        shareData.content.content ||
        shareData.content.title ||
        "Shared Content";
      const file = new Blob([content], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `${shareData.content.title || "shared-content"}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed");
    }
  };

  const renderResearchContent = (content) => {
    return (
      <div className="mx-auto max-w-full px-4 py-6 sm:px-6 md:px-8">
        {/* Research Title */}
        <h2 className="text-foreground mb-4 text-2xl font-semibold sm:text-3xl">
          {content.title || "Research Results"}
        </h2>

        {/* Research Query */}
        {content.query && (
          <p className="text-muted-foreground mb-6 text-base italic">
            Query: {content.query}
          </p>
        )}

        <Separator className="my-6" />

        {/* Main Research Content - This is where the red arrow points */}
        <div
          className="[&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_p]:text-foreground [&_blockquote]:border-primary [&_blockquote]:bg-muted [&_code]:bg-muted [&_pre]:bg-muted max-w-none [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mt-6 [&_h4]:mb-3 [&_h4]:text-lg [&_h4]:font-semibold [&_li]:mb-2 [&_li]:leading-relaxed [&_ol]:mb-4 [&_ol]:pl-6 [&_p]:mb-4 [&_p]:text-base [&_p]:leading-relaxed [&_pre]:overflow-auto [&_pre]:rounded [&_pre]:p-4 [&_pre]:font-mono [&_ul]:mb-4 [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.content) }}
        />

        {/* Sources Section */}
        {content.sources && content.sources.length > 0 && (
          <div className="mt-12">
            <h3 className="text-foreground mb-6 text-xl font-semibold">
              Sources ({content.sources.length})
            </h3>
            <div className="mb-6 flex flex-wrap gap-3">
              {content.sources.map((source, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                  onClick={() => window.open(source.url, "_blank")}
                >
                  {source.title || source.url}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderChatContent = (content) => {
    return (
      <div>
        <h2 className="text-foreground mb-4 text-2xl font-semibold sm:text-3xl">
          {content.title || "Chat Conversation"}
        </h2>

        <Separator className="my-4" />

        {content.messages &&
          content.messages.map((message, index) => (
            <Card key={index} className="mb-4">
              <CardContent className="p-4">
                <p className="text-foreground mb-2 text-base">
                  {message.content}
                </p>
                <p className="text-muted-foreground text-sm">
                  {message.role} •{" "}
                  {new Date(message.timestamp).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
      </div>
    );
  };

  const renderDocumentContent = (content) => {
    return (
      <div>
        <h2 className="text-foreground mb-4 text-2xl font-semibold sm:text-3xl">
          {content.title || "Document"}
        </h2>

        <Separator className="my-4" />

        <div
          className="[&_h1]:mt-6 [&_h1]:mb-2 [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-bold [&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:font-bold [&_h5]:mt-6 [&_h5]:mb-2 [&_h5]:font-bold [&_h6]:mt-6 [&_h6]:mb-2 [&_h6]:font-bold [&_p]:mb-4 [&_p]:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.content) }}
        />
      </div>
    );
  };

  const renderContent = () => {
    if (!shareData) return null;

    switch (shareData.contentType) {
      case "research":
        return renderResearchContent(shareData.content);
      case "chat":
        return renderChatContent(shareData.content);
      case "document":
        return renderDocumentContent(shareData.content);
      default:
        return (
          <p className="text-foreground text-base">
            {JSON.stringify(shareData.content, null, 2)}
          </p>
        );
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="size-8" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <p className="text-foreground text-base">
          The shared content could not be loaded. It may have expired or been
          removed.
        </p>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <Alert variant="default">
          <AlertDescription>No content found for this share.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Minimal Header - Only essential info */}
      <div className="bg-card border-border border-b px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h6 className="text-foreground text-lg font-semibold">
                SHOTHIK AI
              </h6>
              <p className="text-muted-foreground text-sm">Shared Research</p>
            </div>

            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleCopyLink}
                  >
                    <Copy className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy Link</p>
                </TooltipContent>
              </Tooltip>

              {shareData.permissions?.allowDownload && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleDownload}
                    >
                      <Download className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - This is where the red arrow points */}
      <div className="flex-1 py-0">
        <div className="mx-auto max-w-6xl py-8">{renderContent()}</div>
      </div>

      {/* Minimal Footer */}
      <div className="bg-card border-border border-t py-4 text-center">
        <p className="text-muted-foreground text-sm">
          Shared with SHOTHIK AI • {shareData.currentViews} views •{" "}
          {new Date(shareData.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default SharedContentPage;
