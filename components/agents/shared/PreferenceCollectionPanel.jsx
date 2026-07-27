import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Clock, Palette, Sparkles, Users, Wand2, X } from "lucide-react";
import { useState } from "react";

const COLOR_SCHEMES = [
  {
    id: "professional",
    name: "Professional",
    colors: ["#1976d2", "#424242", "#f5f5f5"],
  },
  { id: "vibrant", name: "Vibrant", colors: ["#ff5722", "#ff9800", "#ffc107"] },
  { id: "minimal", name: "Minimal", colors: ["#000000", "#ffffff", "#f0f0f0"] },
  { id: "custom", name: "Custom", colors: [] },
];

const STYLE_OPTIONS = [
  {
    id: "corporate",
    name: "Corporate",
    description: "Professional business style",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Modern and artistic design",
  },
  { id: "academic", name: "Academic", description: "Clean educational layout" },
  { id: "minimal", name: "Minimal", description: "Simple and focused design" },
];

const ANIMATION_OPTIONS = [
  { id: "none", name: "None", description: "No animations" },
  { id: "subtle", name: "Subtle", description: "Light transitions" },
  { id: "dynamic", name: "Dynamic", description: "Engaging animations" },
];

export default function PreferenceCollectionPanel({
  onPreferencesUpdate,
  onComplete,
}) {
  const [preferences, setPreferences] = useState({
    colorScheme: "professional",
    customColors: ["#07B37A", "#ffffff"],
    style: "corporate",
    animation: "subtle",
    audienceLevel: "business",
    duration: 15,
    fontPreference: "modern",
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [customColorInput, setCustomColorInput] = useState("#07B37A");

  const steps = [
    {
      id: "colors",
      title: "Color Preferences",
      icon: <Palette className="size-5" />,
    },
    { id: "style", title: "Design Style", icon: <Wand2 className="size-5" /> },
    {
      id: "animation",
      title: "Animation Level",
      icon: <Sparkles className="size-5" />,
    },
    {
      id: "audience",
      title: "Target Audience",
      icon: <Users className="size-5" />,
    },
    {
      id: "duration",
      title: "Presentation Length",
      icon: <Clock className="size-5" />,
    },
  ];

  const handlePreferenceChange = (key, value) => {
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);
    onPreferencesUpdate?.(updatedPreferences);
  };

  const addCustomColor = () => {
    if (
      customColorInput &&
      !preferences.customColors.includes(customColorInput)
    ) {
      const newColors = [...preferences.customColors, customColorInput];
      handlePreferenceChange("customColors", newColors);
      setCustomColorInput("#07B37A");
    }
  };

  const removeCustomColor = (colorToRemove) => {
    const newColors = preferences.customColors.filter(
      (color) => color !== colorToRemove,
    );
    handlePreferenceChange("customColors", newColors);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.(preferences);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case "colors":
        return (
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Choose your color scheme
            </h3>
            <div className="mb-6 grid grid-cols-2 gap-4">
              {COLOR_SCHEMES.map((scheme) => (
                <Card
                  key={scheme.id}
                  className={cn(
                    "cursor-pointer transition-shadow hover:shadow-md",
                    preferences.colorScheme === scheme.id
                      ? "border-primary border-2"
                      : "border-border border",
                  )}
                  onClick={() =>
                    handlePreferenceChange("colorScheme", scheme.id)
                  }
                >
                  <CardContent className="py-4 text-center">
                    <p className="mb-2 text-sm font-medium">{scheme.name}</p>
                    <div className="flex justify-center gap-1">
                      {scheme.colors.map((color, index) => (
                        <div
                          key={index}
                          className="border-border size-6 rounded-full border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {preferences.colorScheme === "custom" && (
              <div>
                <p className="mb-3 text-base font-medium">Add Custom Colors</p>
                <div className="mb-4 flex gap-2">
                  <Input
                    type="color"
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    className="h-9 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    placeholder="#07B37A"
                    className="flex-1"
                  />
                  <Button onClick={addCustomColor} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferences.customColors.map((color) => (
                    <Badge
                      key={color}
                      className="flex items-center gap-1.5 text-white"
                      style={{ backgroundColor: color }}
                    >
                      <span>{color}</span>
                      <button
                        onClick={() => removeCustomColor(color)}
                        className="transition-opacity hover:opacity-70"
                        type="button"
                        aria-label={`Remove color ${color}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "style":
        return (
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Select your presentation style
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {STYLE_OPTIONS.map((style) => (
                <Card
                  key={style.id}
                  className={cn(
                    "cursor-pointer transition-shadow hover:shadow-md",
                    preferences.style === style.id
                      ? "border-primary border-2"
                      : "border-border border",
                  )}
                  onClick={() => handlePreferenceChange("style", style.id)}
                >
                  <CardContent>
                    <h4 className="mb-2 text-lg font-semibold">{style.name}</h4>
                    <p className="text-muted-foreground text-sm">
                      {style.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "animation":
        return (
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Choose animation level
            </h3>
            <RadioGroup
              value={preferences.animation}
              onValueChange={(value) =>
                handlePreferenceChange("animation", value)
              }
            >
              {ANIMATION_OPTIONS.map((option) => (
                <div key={option.id} className="mb-3 flex items-start gap-3">
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    className="mt-0.5"
                  />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    <p className="text-base font-medium">{option.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {option.description}
                    </p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "audience":
        return (
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Who is your target audience?
            </h3>
            <RadioGroup
              value={preferences.audienceLevel}
              onValueChange={(value) =>
                handlePreferenceChange("audienceLevel", value)
              }
            >
              <div className="mb-3 flex items-start gap-3">
                <RadioGroupItem
                  value="executive"
                  id="executive"
                  className="mt-0.5"
                />
                <Label htmlFor="executive" className="cursor-pointer">
                  Executive Level (High-level overview)
                </Label>
              </div>
              <div className="mb-3 flex items-start gap-3">
                <RadioGroupItem
                  value="business"
                  id="business"
                  className="mt-0.5"
                />
                <Label htmlFor="business" className="cursor-pointer">
                  Business Professional (Balanced detail)
                </Label>
              </div>
              <div className="mb-3 flex items-start gap-3">
                <RadioGroupItem
                  value="technical"
                  id="technical"
                  className="mt-0.5"
                />
                <Label htmlFor="technical" className="cursor-pointer">
                  Technical Team (Detailed information)
                </Label>
              </div>
              <div className="mb-3 flex items-start gap-3">
                <RadioGroupItem
                  value="general"
                  id="general"
                  className="mt-0.5"
                />
                <Label htmlFor="general" className="cursor-pointer">
                  General Audience (Easy to understand)
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case "duration":
        return (
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Expected presentation duration
            </h3>
            <div className="px-4">
              <Slider
                value={[preferences.duration]}
                onValueChange={(values) =>
                  handlePreferenceChange("duration", values[0])
                }
                min={5}
                max={60}
                step={5}
                className="w-full"
              />
              <div className="text-muted-foreground mt-2 flex justify-between text-xs">
                <span>5 min</span>
                <span>15 min</span>
                <span>30 min</span>
                <span>1 hour</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 text-center text-sm">
              Current selection: {preferences.duration} minutes
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="mx-auto max-w-[600px]">
      <CardContent className="p-6">
        {/* Progress Steps */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex-1 text-center">
                <div
                  className={cn(
                    "mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    index <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {step.icon}
                </div>
                <p
                  className={cn(
                    "text-xs",
                    index <= currentStep
                      ? "text-primary"
                      : "text-muted-foreground",
                    index === currentStep && "font-semibold",
                  )}
                >
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-6 min-h-[300px]">{renderStepContent()}</div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            onClick={prevStep}
            disabled={currentStep === 0}
            variant="outline"
          >
            Previous
          </Button>
          <Button onClick={nextStep} variant="default">
            {currentStep === steps.length - 1 ? "Complete Setup" : "Next"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
