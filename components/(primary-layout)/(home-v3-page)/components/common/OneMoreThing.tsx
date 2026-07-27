"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function OneMoreThing() {
  return (
    <section className="bg-background relative overflow-hidden py-16 md:py-24">
      <div className="relative mx-auto max-w-[896px] px-4 text-center md:px-8">
        <div className="text-overline text-muted-foreground mb-6">
          And one more thing...
        </div>

        <h2 className="text-h1 text-foreground mb-6 leading-tight">
          Meta Andromeda
          <br />
          powered ads.
        </h2>

        <p className="text-h5 text-muted-foreground mx-auto mb-12 max-w-[672px] font-normal">
          Create Facebook & Instagram ads that actually convert. Automatically.
        </p>

        <Card className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(24,119,242,0.2)] md:p-6 dark:border-white/10 dark:bg-white/5">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-2">
              <div>
                <h4 className="text-h4 text-foreground mb-3">
                  8-15 creative variants
                </h4>
                <p className="text-body1 text-muted-foreground">
                  Persona-based ad copy for every audience stage.
                </p>
              </div>
              <div>
                <h4 className="text-h4 text-foreground mb-3">
                  All formats supported
                </h4>
                <p className="text-body1 text-muted-foreground">
                  Reels, carousel, static, video—all optimized.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          data-testid="button-try-meta-ads"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Try Meta Ad Automation
        </Button>
      </div>
    </section>
  );
}
