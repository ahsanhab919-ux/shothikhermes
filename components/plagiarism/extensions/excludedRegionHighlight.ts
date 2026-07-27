import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export type ExcludedDecorationRegion = {
  from: number;
  to: number;
  type: "latex" | "code" | "reference" | "quote";
};

const excludedPluginKey = new PluginKey<DecorationSet>("excludedRegionHighlight");

const typeStyles: Record<string, { class: string; label: string }> = {
  latex: {
    class: "excluded-region excluded-region-latex",
    label: "LaTeX (excluded)",
  },
  code: {
    class: "excluded-region excluded-region-code",
    label: "Code (excluded)",
  },
  reference: {
    class: "excluded-region excluded-region-reference",
    label: "Reference (excluded)",
  },
  quote: {
    class: "excluded-region excluded-region-quote",
    label: "Quote (excluded)",
  },
};

const buildExcludedDecorationSet = (
  doc: Parameters<typeof DecorationSet.create>[0],
  regions: ExcludedDecorationRegion[]
) => {
  if (!regions?.length) {
    return DecorationSet.empty;
  }

  const decorations = regions
    .filter(
      (r) =>
        typeof r?.from === "number" &&
        typeof r?.to === "number" &&
        r.to > r.from &&
        r.from >= 0 &&
        r.to <= doc.content.size
    )
    .map((region) => {
      const style = typeStyles[region.type] || typeStyles.code;
      return Decoration.inline(region.from, region.to, {
        class: style.class,
        "data-excluded-type": region.type,
        "aria-label": style.label,
        title: style.label,
      });
    });

  return DecorationSet.create(doc, decorations);
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    excludedRegionHighlight: {
      setExcludedRegions: (regions: ExcludedDecorationRegion[]) => ReturnType;
    };
  }
}

export const ExcludedRegionHighlightExtension = Extension.create({
  name: "excludedRegionHighlight",

  addStorage() {
    return {
      regions: [] as ExcludedDecorationRegion[],
    };
  },

  addCommands() {
    return {
      setExcludedRegions:
        (regions: ExcludedDecorationRegion[] = []) =>
        ({ tr, dispatch }) => {
          const sanitized = Array.isArray(regions) ? regions : [];
          this.storage.regions = sanitized;
          if (dispatch) {
            dispatch(tr.setMeta(excludedPluginKey, { regions: sanitized }));
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    const plugin = new Plugin<DecorationSet>({
      key: excludedPluginKey,
      state: {
        init: (_, state) => {
          return buildExcludedDecorationSet(state.doc, extension.storage.regions);
        },
        apply(tr, old, _oldState, newState) {
          const meta = tr.getMeta(excludedPluginKey);
          if (meta && Array.isArray(meta.regions)) {
            extension.storage.regions = meta.regions;
            return buildExcludedDecorationSet(newState.doc, extension.storage.regions);
          }

          if (tr.docChanged) {
            return buildExcludedDecorationSet(newState.doc, extension.storage.regions);
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

export default ExcludedRegionHighlightExtension;
