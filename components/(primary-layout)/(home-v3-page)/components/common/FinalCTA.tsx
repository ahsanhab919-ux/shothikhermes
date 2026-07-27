"use client";

import { Button } from "@/components/ui/button";

export default function FinalCTA() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
        <h2 className="text-h1 text-foreground mb-12 leading-tight">
          Ready to begin?
        </h2>

        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground mb-4"
          data-testid="button-get-started-final"
        >
          Get Started
        </Button>

        <p className="text-body2 text-muted-foreground">
          No credit card required
        </p>
      </div>
    </section>
  );
}
