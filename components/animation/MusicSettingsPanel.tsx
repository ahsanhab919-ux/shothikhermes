"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Music, Volume2, Sparkles } from "lucide-react";

const MOODS = [
  { id: "professional", name: "Professional", description: "Corporate, polished background music" },
  { id: "upbeat", name: "Upbeat", description: "Energetic, positive vibes" },
  { id: "calm", name: "Calm", description: "Relaxing, peaceful atmosphere" },
  { id: "dramatic", name: "Dramatic", description: "Cinematic, emotional impact" },
  { id: "inspirational", name: "Inspirational", description: "Motivational, uplifting" },
  { id: "corporate", name: "Corporate", description: "Business-focused, sophisticated" },
];

export default function MusicSettingsPanel() {
  const [selectedMood, setSelectedMood] = useState("professional");
  const [instrumental, setInstrumental] = useState(true);
  const [volume, setVolume] = useState([20]); // 20% of voice volume

  return (
    <div className="space-y-6">
      {/* Mood Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOODS.map((mood) => (
          <Card
            key={mood.id}
            className={`cursor-pointer transition-all ${
              selectedMood === mood.id
                ? "ring-2 ring-primary border-primary"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => setSelectedMood(mood.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Music className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{mood.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mood.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Music Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Music Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Volume */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Music Volume (relative to voice)</Label>
              <span className="text-sm text-muted-foreground">{volume[0]}%</span>
            </div>
            <Slider
              value={volume}
              onValueChange={setVolume}
              min={0}
              max={50}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 15-25% for background music
            </p>
          </div>

          {/* Instrumental Only */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm">Instrumental Only</Label>
            </div>
            <Switch
              checked={instrumental}
              onCheckedChange={setInstrumental}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Generate instrumental music without vocals
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
