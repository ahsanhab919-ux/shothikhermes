"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mic, Volume2, Sparkles } from "lucide-react";

const VOICES = [
  { id: "professional-presenter", name: "Professional Presenter", description: "Clear, authoritative voice for business content" },
  { id: "friendly-guide", name: "Friendly Guide", description: "Warm, approachable voice for tutorials" },
  { id: "energetic-host", name: "Energetic Host", description: "Dynamic, enthusiastic voice for marketing" },
  { id: "calm-narrator", name: "Calm Narrator", description: "Peaceful, soothing voice for storytelling" },
];

export default function VoiceSettingsPanel() {
  const [selectedVoice, setSelectedVoice] = useState("professional-presenter");
  const [stability, setStability] = useState([0.5]);
  const [similarityBoost, setSimilarityBoost] = useState([0.75]);
  const [useSpeakerBoost, setUseSpeakerBoost] = useState(true);

  return (
    <div className="space-y-6">
      {/* Voice Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {VOICES.map((voice) => (
          <Card
            key={voice.id}
            className={`cursor-pointer transition-all ${
              selectedVoice === voice.id
                ? "ring-2 ring-primary border-primary"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => setSelectedVoice(voice.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Mic className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{voice.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {voice.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Voice Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Voice Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stability */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Stability</Label>
              <span className="text-sm text-muted-foreground">{stability[0].toFixed(2)}</span>
            </div>
            <Slider
              value={stability}
              onValueChange={setStability}
              min={0}
              max={1}
              step={0.01}
            />
            <p className="text-xs text-muted-foreground">
              Higher values make the voice more consistent
            </p>
          </div>

          {/* Similarity Boost */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Similarity Boost</Label>
              <span className="text-sm text-muted-foreground">{similarityBoost[0].toFixed(2)}</span>
            </div>
            <Slider
              value={similarityBoost}
              onValueChange={setSimilarityBoost}
              min={0}
              max={1}
              step={0.01}
            />
            <p className="text-xs text-muted-foreground">
              Higher values make the voice more similar to the original
            </p>
          </div>

          {/* Speaker Boost */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm">Speaker Boost</Label>
            </div>
            <Switch
              checked={useSpeakerBoost}
              onCheckedChange={setUseSpeakerBoost}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
