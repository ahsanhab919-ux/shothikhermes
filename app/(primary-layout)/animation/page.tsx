"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Music, 
  Mic, 
  Settings, 
  Play, 
  Download,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import TemplateSelector from "@/components/animation/TemplateSelector";
import VoiceSettingsPanel from "@/components/animation/VoiceSettingsPanel";
import MusicSettingsPanel from "@/components/animation/MusicSettingsPanel";
import VideoProgress from "@/components/animation/VideoProgress";
import { useAnimationGeneration } from "@/hooks/useAnimationGeneration";

const VIDEO_TEMPLATES = [
  {
    id: "explainer",
    name: "Explainer",
    description: "Clean, minimal design for educational content",
    previewUrl: "/templates/explainer.jpg",
  },
  {
    id: "product_launch",
    name: "Product Launch",
    description: "Bold and energetic for announcements",
    previewUrl: "/templates/product-launch.jpg",
  },
  {
    id: "tutorial",
    name: "Tutorial",
    description: "Step-by-step instructional style",
    previewUrl: "/templates/tutorial.jpg",
  },
  {
    id: "storytelling",
    name: "Storytelling",
    description: "Cinematic and emotional",
    previewUrl: "/templates/storytelling.jpg",
  },
  {
    id: "data_presentation",
    name: "Data Presentation",
    description: "Charts and numbers focused",
    previewUrl: "/templates/data.jpg",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and elegant",
    previewUrl: "/templates/minimal.jpg",
  },
];

export default function AnimationPage() {
  const [selectedTemplate, setSelectedTemplate] = useState("explainer");
  const [activeTab, setActiveTab] = useState("template");
  const [scriptTopic, setScriptTopic] = useState("");
  const [scriptContent, setScriptContent] = useState("");

  const {
    isGenerating,
    progress,
    status,
    error,
    videoUrl,
    jobId,
    generateVideo,
    exportVideo,
    reset,
  } = useAnimationGeneration();

  const buildSlideDeckFromScript = () => {
    const topic = scriptTopic.trim() || "Presentation";
    const paragraphs = scriptContent.trim()
      ? scriptContent.trim().split(/\n\n+/).filter(Boolean)
      : [topic];

    return {
      id: `deck-${Date.now()}`,
      title: topic,
      slides: paragraphs.map((para, i) => ({
        id: `slide-${i + 1}`,
        title: i === 0 ? topic : `Part ${i + 1}`,
        content: para.trim(),
        speakerNotes: para.trim(),
        layout: i === 0 ? "title" : "content",
      })),
    };
  };

  const handleGenerate = async () => {
    if (!scriptTopic.trim() && !scriptContent.trim()) return;
    try {
      const slideDeck = buildSlideDeckFromScript();

      await generateVideo({
        slideDeck,
        template: selectedTemplate,
        resolution: "1080p",
        frameRate: "30fps",
        voice: {
          provider: "elevenlabs",
          voiceId: "professional-presenter",
          stability: 0.5,
          similarityBoost: 0.75,
          useSpeakerBoost: true,
        },
        music: {
          provider: "suno",
          mood: "professional",
          instrumental: true,
        },
        subtitles: true,
        watermark: false,
      });
    } catch (err) {
      console.error("Generation failed:", err);
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case "pending":
        return { text: "Queued", icon: Loader2, color: "text-yellow-500" };
      case "generating_voice":
        return { text: "Generating Voiceover", icon: Mic, color: "text-blue-500" };
      case "generating_music":
        return { text: "Generating Music", icon: Music, color: "text-purple-500" };
      case "rendering":
        return { text: "Rendering Video", icon: Video, color: "text-orange-500" };
      case "completed":
        return { text: "Completed", icon: CheckCircle, color: "text-green-500" };
      case "failed":
        return { text: "Failed", icon: AlertCircle, color: "text-red-500" };
      default:
        return { text: "Ready", icon: Play, color: "text-gray-500" };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Animation Agent</h1>
        <p className="text-muted-foreground">
          Transform your slides into professional videos with AI voiceover and music
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Settings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Script Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Video Script
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Topic / Title</label>
                <input
                  type="text"
                  value={scriptTopic}
                  onChange={e => setScriptTopic(e.target.value)}
                  placeholder="e.g. Introduction to Machine Learning"
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Script Content <span className="text-muted-foreground font-normal">(separate slides with blank lines)</span>
                </label>
                <textarea
                  value={scriptContent}
                  onChange={e => setScriptContent(e.target.value)}
                  placeholder={"Slide 1: Introduce the topic and hook the audience...\n\nSlide 2: Explain the core concept with examples...\n\nSlide 3: Summarize and call to action..."}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background resize-none"
                  rows={6}
                />
              </div>
              {scriptContent.trim() && (
                <p className="text-xs text-muted-foreground">
                  {scriptContent.trim().split(/\n\n+/).filter(Boolean).length} slide(s) detected
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Video Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="template">Template</TabsTrigger>
                  <TabsTrigger value="voice">Voice</TabsTrigger>
                  <TabsTrigger value="music">Music</TabsTrigger>
                </TabsList>

                <TabsContent value="template" className="mt-4">
                  <TemplateSelector
                    templates={VIDEO_TEMPLATES}
                    selected={selectedTemplate}
                    onSelect={setSelectedTemplate}
                  />
                </TabsContent>

                <TabsContent value="voice" className="mt-4">
                  <VoiceSettingsPanel />
                </TabsContent>

                <TabsContent value="music" className="mt-4">
                  <MusicSettingsPanel />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Preview & Actions */}
        <div className="space-y-4">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <StatusIcon className={`h-5 w-5 ${statusDisplay.color} ${isGenerating ? 'animate-spin' : ''}`} />
                <span className={statusDisplay.color}>{statusDisplay.text}</span>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-xs text-muted-foreground text-center">
                    {progress}% complete
                  </p>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-500 mt-2">{error}</div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {!videoUrl ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isGenerating || (!scriptTopic.trim() && !scriptContent.trim())}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Video className="mr-2 h-4 w-4" />
                        Generate Video
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      variant="outline"
                      onClick={() => window.open(videoUrl, '_blank')}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Preview Video
                    </Button>
                    <Button
                      className="w-full mt-2"
                      size="lg"
                      onClick={() => exportVideo('mp4')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download MP4
                    </Button>
                    <Button
                      className="w-full mt-2"
                      variant="ghost"
                      onClick={reset}
                    >
                      Create New Video
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Selected Template</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const template = VIDEO_TEMPLATES.find(t => t.id === selectedTemplate);
                return template ? (
                  <div>
                    <Badge className="mb-2">{template.name}</Badge>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
