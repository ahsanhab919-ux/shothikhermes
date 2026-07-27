export type TSettingsState = {
  theme?: "light" | "dark" | "system" | "semi-dark";
  direction?: "ltr" | "rtl";
  language?: "en" | "bn";
  sidebar?: "expanded" | "compact";
  header?: "expanded" | "compact";
  layout?: "vertical" | "horizontal";

  // features settings
  demo?: Record<string, unknown>;
  paraphraseOptions: {
    paraphraseQuotations: boolean;
    avoidContractions: boolean;
    preferActiveVoice: boolean;
    automaticStartParaphrasing: boolean;
    autoFreeze: boolean;
  };

  interfaceOptions: {
    useYellowHighlight: boolean;
    showTooltips: boolean;
    showChangedWords: boolean;
    showStructuralChanges: boolean;
    showLongestUnchangedWords: boolean;
  };

  humanizeOptions: {
    humanizeQuotations: boolean;
    avoidContractions: boolean;
    automaticStartHumanize: boolean;
  };
};
