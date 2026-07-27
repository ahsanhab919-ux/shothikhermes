"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  STYLE_PRESETS,
  useStyleEditing,
  type StylePreset,
} from "@/hooks/presentation/useStyleEditing";
import type { ElementData } from "@/redux/slices/slideEditSlice";
import { RotateCcw, Save, X } from "lucide-react";
import { useEffect, useState } from "react";

interface StyleEditorProps {
  slideId: string;
  element: ElementData;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onClose: () => void;
}

/**
 * Common color presets
 */
const COLOR_PRESETS = [
  "#000000",
  "#333333",
  "#666666",
  "#999999",
  "#CCCCCC",
  "#FFFFFF",
  "#FF0000",
  "#FF6600",
  "#FFCC00",
  "#33CC33",
  "#0099FF",
  "#6633FF",
  "#FF0099",
  "#07B37A",
  "#F44336",
  "#2196F3",
  "#FF9800",
  "#4CAF50",
];

/**
 * Common font families
 */
const FONT_FAMILIES = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Courier New, monospace", label: "Courier New" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Impact, sans-serif", label: "Impact" },
  { value: "Comic Sans MS, cursive", label: "Comic Sans MS" },
  { value: "Trebuchet MS, sans-serif", label: "Trebuchet MS" },
  { value: "Palatino, serif", label: "Palatino" },
];

/**
 * Font weights
 */
const FONT_WEIGHTS = [
  { value: "100", label: "Thin (100)" },
  { value: "200", label: "Extra Light (200)" },
  { value: "300", label: "Light (300)" },
  { value: "400", label: "Normal (400)" },
  { value: "500", label: "Medium (500)" },
  { value: "600", label: "Semi Bold (600)" },
  { value: "700", label: "Bold (700)" },
  { value: "800", label: "Extra Bold (800)" },
  { value: "900", label: "Black (900)" },
];

/**
 * Style Editor Component
 * Provides comprehensive style editing with live preview
 */
export function StyleEditor({
  slideId,
  element,
  iframeRef,
  onClose,
}: StyleEditorProps) {
  const styleEditing = useStyleEditing(
    slideId,
    element.id,
    element.elementPath,
    iframeRef,
  );

  const [activeTab, setActiveTab] = useState("text");

  // Auto-start editing when component mounts
  useEffect(() => {
    if (styleEditing.startEditing()) {
      // Styles are loaded automatically
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle save
  const handleSave = () => {
    styleEditing.stopEditing(true);
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    styleEditing.stopEditing(false);
    onClose();
  };

  // Handle preset selection
  const handlePresetSelect = (preset: StylePreset) => {
    styleEditing.applyPreset(preset);
  };

  // Parse font size from string (e.g., "16px" -> 16)
  const parseFontSize = (size: string | undefined): number => {
    if (!size) return 16;
    const match = size.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 16;
  };

  // Convert number to px string
  const toPx = (value: number): string => `${value}px`;

  // Parse color from computed style (handles rgb/rgba/hex)
  const parseColor = (color: string | undefined): string => {
    if (!color || color === "rgba(0, 0, 0, 0)") return "#000000";

    // If already hex, return as is
    if (color.startsWith("#")) return color;

    // Convert rgb/rgba to hex
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
    }

    return "#000000";
  };

  const currentStyles = styleEditing.currentStyles;
  const fontSize = parseFontSize(currentStyles.fontSize);
  const textColor = parseColor(currentStyles.color);
  const backgroundColor = parseColor(currentStyles.backgroundColor);

  return (
    <Card className="border-primary w-96 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Edit Styles</CardTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCancel}
            aria-label="Close editor"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="spacing">Spacing</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
          </TabsList>

          {/* Text Styles Tab */}
          <TabsContent value="text" className="mt-4 space-y-4">
            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="text-color">Text Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="text-color"
                  type="color"
                  value={textColor}
                  onChange={(e) =>
                    styleEditing.updateStyle("color", e.target.value)
                  }
                  className="h-10 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={textColor}
                  onChange={(e) =>
                    styleEditing.updateStyle("color", e.target.value)
                  }
                  placeholder="#000000"
                  className="flex-1 font-mono text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="border-border h-6 w-6 rounded border transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                    onClick={() => styleEditing.updateStyle("color", color)}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <Label htmlFor="font-family">Font Family</Label>
              <Select
                value={currentStyles.fontFamily || ""}
                onValueChange={(value) =>
                  styleEditing.updateStyle("fontFamily", value)
                }
              >
                <SelectTrigger id="font-family">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="font-size">Font Size</Label>
                <span className="text-muted-foreground text-xs">
                  {fontSize}px
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  id="font-size"
                  min={8}
                  max={72}
                  step={1}
                  value={[fontSize]}
                  onValueChange={([value]) =>
                    styleEditing.updateStyle("fontSize", toPx(value))
                  }
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={8}
                  max={200}
                  value={fontSize}
                  onChange={(e) =>
                    styleEditing.updateStyle(
                      "fontSize",
                      toPx(parseInt(e.target.value, 10) || 16),
                    )
                  }
                  className="w-20"
                />
              </div>
            </div>

            {/* Font Weight */}
            <div className="space-y-2">
              <Label htmlFor="font-weight">Font Weight</Label>
              <Select
                value={currentStyles.fontWeight || "400"}
                onValueChange={(value) =>
                  styleEditing.updateStyle("fontWeight", value)
                }
              >
                <SelectTrigger id="font-weight">
                  <SelectValue placeholder="Select weight" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHTS.map((weight) => (
                    <SelectItem key={weight.value} value={weight.value}>
                      {weight.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Text Align */}
            <div className="space-y-2">
              <Label htmlFor="text-align">Text Align</Label>
              <Select
                value={currentStyles.textAlign || "left"}
                onValueChange={(value) =>
                  styleEditing.updateStyle("textAlign", value)
                }
              >
                <SelectTrigger id="text-align">
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="justify">Justify</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Background Color */}
            <div className="space-y-2">
              <Label htmlFor="bg-color">Background Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="bg-color"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) =>
                    styleEditing.updateStyle("backgroundColor", e.target.value)
                  }
                  className="h-10 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) =>
                    styleEditing.updateStyle("backgroundColor", e.target.value)
                  }
                  placeholder="#FFFFFF"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </TabsContent>

          {/* Spacing Tab */}
          <TabsContent value="spacing" className="mt-4 space-y-4">
            {/* Padding */}
            <div className="space-y-2">
              <Label htmlFor="padding">Padding</Label>
              <Input
                id="padding"
                type="text"
                value={currentStyles.padding || ""}
                onChange={(e) =>
                  styleEditing.updateStyle(
                    "padding",
                    e.target.value || undefined,
                  )
                }
                placeholder="e.g., 10px or 10px 20px"
              />
            </div>

            {/* Margin */}
            <div className="space-y-2">
              <Label htmlFor="margin">Margin</Label>
              <Input
                id="margin"
                type="text"
                value={currentStyles.margin || ""}
                onChange={(e) =>
                  styleEditing.updateStyle(
                    "margin",
                    e.target.value || undefined,
                  )
                }
                placeholder="e.g., 10px or 10px 20px"
              />
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
              <Label htmlFor="border-radius">Border Radius</Label>
              <Input
                id="border-radius"
                type="text"
                value={currentStyles.borderRadius || ""}
                onChange={(e) =>
                  styleEditing.updateStyle(
                    "borderRadius",
                    e.target.value || undefined,
                  )
                }
                placeholder="e.g., 4px or 50%"
              />
            </div>
          </TabsContent>

          {/* Presets Tab */}
          <TabsContent value="presets" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Style Presets</Label>
              <div className="space-y-2">
                {STYLE_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Reset Styles */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={styleEditing.resetStyles}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to Default
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            Changes apply instantly
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            aria-label="Cancel editing"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            aria-label="Save changes"
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
