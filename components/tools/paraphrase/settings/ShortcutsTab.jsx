// ShortcutsTab.jsx
import { cn } from "@/lib/utils";

const ShortcutsTab = ({
  fromComp = "paraphrase", // This flag is to maintain different sesstings on same component. ENUM: [paraphrase, humanize, ai-detector, grammar-fix, translator]
}) => {
  const humanizeRows = [
    { action: "Copy sentence", shortcut: "Ctrl + C" },
    {
      action: "Humanize all text",
      shortcut: "Ctrl + Enter",
    },
    {
      action: "Copy all humanized text",
      shortcut: "Ctrl + C",
    },
  ];
  const paraphraseRows = [
    { action: "Paraphrase text", shortcut: "Ctrl/Cmd + Enter" },
    {
      action: "Clear all",
      shortcut: "Ctrl/Cmd + Shift + C",
    },
    {
      action: "Copy output",
      shortcut: "Ctrl/Cmd + K",
    },
    {
      action: "Cycle language",
      shortcut: "Ctrl/Cmd + Shift + L",
    },
    {
      action: "Switch mode",
      shortcut: "Ctrl/Cmd + 1-4",
    },
    {
      action: "Clear output",
      shortcut: "Escape",
    },
  ];

  const currentCompData =
    fromComp === "paraphrase" ? paraphraseRows : humanizeRows;

  return (
    <div id="shortcuts_tab" className="px-2 py-1">
      {/* Title */}
      <h2 className="mb-4 text-lg font-bold">Keyboard Shortcuts</h2>

      {/* Header Row */}
      <div className="mb-1 flex justify-between">
        <p className="text-muted-foreground text-sm font-medium">Action</p>
        <p className="text-muted-foreground text-sm font-medium">
          Keyboard shortcut
        </p>
      </div>

      {/* Data Rows */}
      {currentCompData.map((row, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center justify-between py-1",
            i < currentCompData.length - 1 && "border-border border-b",
          )}
        >
          <p className="text-sm">{row.action}</p>
          <p className="font-mono text-sm">{row.shortcut}</p>
        </div>
      ))}

      {/* Section Divider */}
      {/* <div className="my-3 border-t border-border" /> */}

      {/* Canvas Divider Section */}
      {/* <p className="text-muted-foreground mb-1 text-sm font-medium">
        Canvas divider
      </p>
      <div className="flex items-center justify-between py-1">
        <p className="text-sm">Auto center</p>
        <p className="font-mono text-sm">Ctrl + |</p>
      </div> */}
    </div>
  );
};

export default ShortcutsTab;
