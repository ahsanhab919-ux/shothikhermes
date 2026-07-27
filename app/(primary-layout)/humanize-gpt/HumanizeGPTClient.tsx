"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { User, Loader2, Copy, Check, History, Sparkles } from "lucide-react";

const modes = [
  {
    id: "natural",
    label: "Natural",
    description: "Make it sound like a real person",
  },
  {
    id: "casual",
    label: "Casual",
    description: "Relaxed, conversational tone",
  },
  {
    id: "professional",
    label: "Professional",
    description: "Polished but human",
  },
  {
    id: "academic",
    label: "Academic",
    description: "Scholarly but accessible",
  },
];

export default function HumanizeGPTClient() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("natural");
  const [intensity, setIntensity] = useState([50]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Array<{ original: string; humanized: string; mode: string }>>([]);

  const handleHumanize = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/tools/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          mode,
          intensity: intensity[0],
        }),
      });
      const data = await response.json();
      const humanized = data.humanized || data.result || "";
      setResult(humanized);
      
      setHistory((prev) => [
        { original: text, humanized, mode },
        ...prev.slice(0, 4),
      ]);
    } catch (error) {
      console.error("Humanization failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8 text-pink-500" />
          Humanize GPT
        </h1>
        <p className="text-muted-foreground mt-2">
          Transform AI-generated text into natural, human-like writing
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI-Generated Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste AI-generated text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px]"
            />

            <div className="grid grid-cols-2 gap-2">
              {modes.map((m) => (
                <Button
                  key={m.id}
                  variant={mode === m.id ? "default" : "outline"}
                  className="h-auto py-3 flex flex-col items-start"
                  onClick={() => setMode(m.id)}
                >
                  <span className="font-medium">{m.label}</span>
                  <span className="text-xs opacity-70">{m.description}</span>
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Humanization Intensity</span>
                <span className="text-sm font-medium">{intensity[0]}%</span>
              </div>
              <Slider
                value={intensity}
                onValueChange={setIntensity}
                max={100}
                step={10}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtle</span>
                <span>Aggressive</span>
              </div>
            </div>

            <Button
              onClick={handleHumanize}
              disabled={!text.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Humanize Text
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Humanized Result</span>
              {result && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Copy
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{result}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{mode}</Badge>
                  <Badge variant="outline">{intensity[0]}% intensity</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Humanized text will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {history.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Humanizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    setText(item.original);
                    setResult(item.humanized);
                    setMode(item.mode);
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{item.mode}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.original.slice(0, 50)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
