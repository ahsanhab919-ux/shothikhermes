"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, MessageCircle, Network, Play, TrendingUp } from "lucide-react";

export default function MindmapFeature() {
  return (
    <section
      data-testid="section-mindmap-feature"
      className="bg-background relative py-20 md:py-32"
    >
      <div className="bg-gradient-radial pointer-events-none absolute top-0 right-0 left-0 h-[300px] from-[rgba(24,119,242,0.15)] to-transparent" />

      <div className="relative z-10 container mx-auto max-w-6xl px-4">
        <div className="mb-20 text-center">
          <Badge className="mb-6 border border-[rgba(24,119,242,0.3)] bg-[rgba(24,119,242,0.15)] text-[#1877F2] hover:bg-[rgba(24,119,242,0.15)]">
            <Brain size={16} className="mr-2" />
            Our Secret Weapon
          </Badge>
          <h2 className="text-h2 text-foreground mb-4 text-5xl font-bold md:text-6xl">
            Strategic Mindmap Feature
          </h2>
          <h6 className="text-h6 text-muted-foreground mx-auto mb-2 max-w-2xl font-normal">
            Don't just launch ads—understand the strategy behind every decision
          </h6>
          <p className="text-body1 text-muted-foreground/60 mx-auto max-w-2xl font-normal">
            Learn why your campaigns work while you earn. Our unique mindmap
            visualizes ad strategy, performance patterns, and optimization
            paths.
          </p>
        </div>

        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
          <div className="relative h-[350px] overflow-hidden rounded-lg border border-white/10 bg-[rgba(15,20,35,0.8)] shadow-[0_20px_60px_rgba(24,119,242,0.2)] md:h-[450px]">
            <div className="border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-[#1877F2]" />
                <span className="text-body2 text-white/70">
                  Campaign Strategy Mindmap
                </span>
              </div>
            </div>

            <div className="relative flex h-[calc(100%-60px)] items-center justify-center p-8">
              <div className="absolute top-1/2 left-1/2 z-[3] flex h-30 w-30 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[#1877F2] to-[#667eea] p-4 text-center text-sm font-bold text-white shadow-[0_10px_40px_rgba(24,119,242,0.4)]">
                Campaign Strategy
              </div>

              {[
                {
                  top: "10%",
                  left: "15%",
                  label: "Audience",
                  color: "#00A76F",
                  lineLength: 200,
                  angle: 135,
                },
                {
                  top: "10%",
                  right: "15%",
                  label: "Creative",
                  color: "#1877F2",
                  lineLength: 200,
                  angle: 225,
                },
                {
                  bottom: "10%",
                  left: "15%",
                  label: "Budget",
                  color: "#00A76F",
                  lineLength: 200,
                  angle: 45,
                },
                {
                  bottom: "10%",
                  right: "15%",
                  label: "Optimize",
                  color: "#1877F2",
                  lineLength: 200,
                  angle: 315,
                },
              ].map((node, index) => (
                <div key={index}>
                  <div
                    className="absolute top-1/2 left-1/2 w-0.5 origin-top bg-white/20"
                    style={{
                      height: `${node.lineLength}px`,
                      transform: `translate(-1px, 0) rotate(${node.angle}deg)`,
                      zIndex: 1,
                    }}
                  />
                  <div
                    className="absolute z-[2] flex h-20 w-20 items-center justify-center rounded-full border-2 bg-white/5 text-xs font-semibold"
                    style={{
                      ...node,
                      borderColor: node.color,
                      color: node.color,
                      boxShadow: `0 5px 20px ${node.color}40`,
                    }}
                  >
                    {node.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-2 rounded bg-black/60 px-4 py-2 backdrop-blur-[10px]">
              <Play size={14} color="#1877F2" />
              <span className="text-caption text-[#1877F2]">Live Demo</span>
            </div>
          </div>

          <div className="text-foreground">
            <h4 className="text-h4 text-foreground mb-8 font-bold">
              Learn & Earn with Visual Intelligence
            </h4>

            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[rgba(24,119,242,0.3)] bg-[rgba(24,119,242,0.15)]">
                  <Network size={24} color="#1877F2" />
                </div>
                <div>
                  <h6 className="text-h6 text-foreground mb-1 font-semibold">
                    Visual Strategy Maps
                  </h6>
                  <p className="text-body2 text-muted-foreground">
                    See how campaigns, ad sets, and creatives connect.
                    Understand the full picture at a glance.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[rgba(0,167,111,0.3)] bg-[rgba(0,167,111,0.15)]">
                  <MessageCircle size={24} color="#00A76F" />
                </div>
                <div>
                  <h6 className="text-h6 text-foreground mb-1 font-semibold">
                    Chat with Your Mindmap
                  </h6>
                  <p className="text-body2 text-muted-foreground">
                    Ask questions about your campaign structure. Get AI-powered
                    insights and recommendations.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[rgba(24,119,242,0.3)] bg-[rgba(24,119,242,0.15)]">
                  <TrendingUp size={24} color="#1877F2" />
                </div>
                <div>
                  <h6 className="text-h6 text-foreground mb-1 font-semibold">
                    Learn What Works
                  </h6>
                  <p className="text-body2 text-muted-foreground">
                    Discover patterns, understand performance drivers, and
                    become a better marketer with every campaign.
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              data-testid="button-try-mindmap"
              className="mt-10 rounded border-[#1877F2] font-semibold text-[#1877F2] hover:bg-[rgba(24,119,242,0.15)]"
            >
              Explore Mindmap Feature
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
