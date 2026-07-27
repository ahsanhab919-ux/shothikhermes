"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, AlertCircle, Coins } from "lucide-react";
import { useGrammarCheck } from "@/hooks/useGrammarCheck";
import { GrammarIssue } from "@/lib/tools/grammar/types";
import { trackToolUsed } from "@/lib/posthog";
import SendToWritingStudioButton from "@/components/tools/common/SendToWritingStudioButton";

export default function GrammarCheckerClient() {
  const [text, setText] = useState("");
  const { check, applySingleCorrection, applyAll, isChecking, result, error } = useGrammarCheck();

  const handleCheck = async () => {
    if (!text.trim()) return;
    const result = await check(text, "en");
    if (result) {
      const wordCount = text.trim().split(/\s+/).length;
      trackToolUsed("grammar-checker", wordCount);
    }
  };

  const handleApplyCorrection = async (issue: GrammarIssue) => {
    const corrected = await applySingleCorrection(issue);
    if (corrected) setText(corrected);
  };

  const handleApplyAll = async () => {
    const corrected = await applyAll();
    if (corrected) setText(corrected);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Grammar Checker</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Text</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter text to check..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px] md:min-h-[300px] text-base"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                {text.length} characters
              </span>
              <Button 
                onClick={handleCheck} 
                disabled={!text.trim() || isChecking}
                className="h-11 px-6"
              >
                {isChecking ? (
                  <><Loader2 className="animate-spin mr-2" /> Checking...</>
                ) : (
                  "Check Grammar"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Results</CardTitle>
            {result && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins className="w-4 h-4" />
                <span>Cost: {result.cost} credits</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!result && !isChecking && (
              <p className="text-muted-foreground">Results will appear here</p>
            )}
            
            {isChecking && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
              </div>
            )}

            {result && result.issues.length === 0 && (
              <div className="flex items-center gap-2 text-green-600 py-4">
                <CheckCircle className="w-5 h-5" />
                <span>No issues found! Great job!</span>
              </div>
            )}

            {result && result.issues.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    {result.issues.length} issue{result.issues.length !== 1 ? 's' : ''} found
                  </span>
                  <div className="flex items-center gap-2">
                    <SendToWritingStudioButton
                      text={text}
                      intent="book"
                      title="Grammar Checker Output"
                      label="Send to Writing Studio"
                    />
                    <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px]" onClick={handleApplyAll}>
                      Apply All
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {result.issues.map((issue) => (
                    <div key={issue.id} className="border p-3 md:p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={issue.severity === 'high' ? 'destructive' : 'secondary'}>
                          {issue.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{issue.severity}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{issue.message}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="line-through text-red-500">{issue.context}</span>
                        <span className="text-green-600">→ {issue.suggestion}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 min-h-[44px] min-w-[44px]"
                        onClick={() => handleApplyCorrection(issue)}
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {result && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground">
                <span>Remaining credits: {result.remainingCredits}</span>
                <SendToWritingStudioButton
                  text={text}
                  intent="book"
                  title="Grammar Checker Draft"
                  label="Continue in Writing Studio"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
