import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export type PlagiarismDecoration = {
  from: number;
  to: number;
  similarity: number;
  isExact?: boolean;
  matchId?: string;
};

const pluginKey = new PluginKey<DecorationSet>("plagiarismHighlight");

const similarityLevel = (similarity: number): "high" | "medium" | "low" => {
  if (similarity >= 75) return "high";
  if (similarity >= 50) return "medium";
  return "low";
};

const buildDecorationSet = (
  doc: Parameters<typeof DecorationSet.create>[0],
  highlights: PlagiarismDecoration[],
) => {
  if (!highlights?.length) {
    return DecorationSet.empty;
  }

  const decorations = highlights
    .filter(
      (range) =>
        typeof range?.from === "number" &&
        typeof range?.to === "number" &&
        range.to > range.from &&
        range.from >= 0 &&
        range.to <= doc.content.size,
    )
    .map((range) => {
      const isExact = range.isExact || range.similarity >= 100;

      let highlightClass: string;
      if (isExact) {
        highlightClass = "plagiarism-highlight plagiarism-highlight-exact rounded-sm px-1 py-0.5 font-semibold shadow-sm";
      } else {
        const level = similarityLevel(range.similarity ?? 0);
        const levelClasses = {
          high: "plagiarism-highlight plagiarism-highlight-high rounded-sm px-1 py-0.5 font-semibold shadow-sm",
          medium: "plagiarism-highlight plagiarism-highlight-medium rounded-sm px-1 py-0.5 font-medium",
          low: "plagiarism-highlight plagiarism-highlight-low rounded-sm px-1 py-0.5",
        };
        highlightClass = levelClasses[level];
      }

      const attrs: Record<string, string> = {
        class: highlightClass,
        "data-similarity": range.similarity?.toString() ?? "0",
        "data-highlight-level": isExact ? "exact" : similarityLevel(range.similarity ?? 0),
      };

      if (range.matchId) {
        attrs["data-match-id"] = range.matchId;
      }

      return Decoration.inline(range.from, range.to, attrs);
    });

  return DecorationSet.create(doc, decorations);
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    plagiarismHighlight: {
      setPlagiarismHighlights: (ranges: PlagiarismDecoration[]) => ReturnType;
    };
  }
}

export const PlagiarismHighlightExtension = Extension.create({
  name: "plagiarismHighlight",

  addStorage() {
    return {
      highlights: [] as PlagiarismDecoration[],
    };
  },

  addCommands() {
    return {
      setPlagiarismHighlights:
        (ranges: PlagiarismDecoration[] = []) =>
        ({ tr, dispatch }) => {
          const sanitized = Array.isArray(ranges) ? ranges : [];
          this.storage.highlights = sanitized;
          if (dispatch) {
            dispatch(tr.setMeta(pluginKey, { highlights: sanitized }));
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    const plugin = new Plugin<DecorationSet>({
      key: pluginKey,
      state: {
        init: (_, state) => {
          const decorations = buildDecorationSet(state.doc, extension.storage.highlights);
          return decorations;
        },
        apply(tr, old, oldState, newState) {
          const meta = tr.getMeta(pluginKey);
          if (meta && Array.isArray(meta.highlights)) {
            extension.storage.highlights = meta.highlights;
            return buildDecorationSet(
              newState.doc,
              extension.storage.highlights,
            );
          }

          if (tr.docChanged) {
            return buildDecorationSet(
              newState.doc,
              extension.storage.highlights,
            );
          }

          return old;
        },
      },
      props: {
        decorations(state) {
          return plugin.getState(state) ?? null;
        },
      },
    });

    return [plugin];
  },
});

export default PlagiarismHighlightExtension;
