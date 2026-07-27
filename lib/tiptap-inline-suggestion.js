"use client";

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const SUGGESTION_KEY = new PluginKey("inlineSuggestion");

export const InlineSuggestion = Extension.create({
  name: "inlineSuggestion",

  addOptions() {
    return {
      onAccept: null,
      onDismiss: null,
      debounceMs: 1500,
    };
  },

  addStorage() {
    return {
      suggestion: "",
      isVisible: false,
      debounceTimer: null,
    };
  },

  addCommands() {
    return {
      setSuggestion:
        (text) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(SUGGESTION_KEY, { type: "set", text });
          }
          return true;
        },
      clearSuggestion:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(SUGGESTION_KEY, { type: "clear" });
          }
          return true;
        },
      acceptSuggestion:
        () =>
        ({ editor, tr, dispatch }) => {
          const pluginState = SUGGESTION_KEY.getState(editor.state);
          if (!pluginState?.text) return false;

          if (dispatch) {
            const { selection } = tr;
            tr.insertText(pluginState.text, selection.from);
            tr.setMeta(SUGGESTION_KEY, { type: "clear" });
          }
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const pluginState = SUGGESTION_KEY.getState(editor.state);
        if (pluginState?.text) {
          editor.commands.acceptSuggestion();
          this.options.onAccept?.();
          return true;
        }
        return false;
      },
      Escape: ({ editor }) => {
        const pluginState = SUGGESTION_KEY.getState(editor.state);
        if (pluginState?.text) {
          editor.commands.clearSuggestion();
          this.options.onDismiss?.();
          return true;
        }
        return false;
      },
      ArrowRight: ({ editor }) => {
        const pluginState = SUGGESTION_KEY.getState(editor.state);
        if (pluginState?.text) {
          const { selection } = editor.state;
          const atEnd = selection.$head.pos === selection.$head.end();
          if (atEnd) {
            editor.commands.acceptSuggestion();
            this.options.onAccept?.();
            return true;
          }
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: SUGGESTION_KEY,
        state: {
          init() {
            return { text: "", decorations: DecorationSet.empty };
          },
          apply(tr, prev) {
            const meta = tr.getMeta(SUGGESTION_KEY);

            if (meta?.type === "clear") {
              return { text: "", decorations: DecorationSet.empty };
            }

            if (meta?.type === "set" && meta.text) {
              const { selection } = tr;
              const pos = selection.from;

              const widget = Decoration.widget(pos, () => {
                const span = document.createElement("span");
                span.className = "ai-inline-suggestion";
                span.textContent = meta.text;
                span.setAttribute("aria-hidden", "true");
                return span;
              });

              return {
                text: meta.text,
                decorations: DecorationSet.create(tr.doc, [widget]),
              };
            }

            if (tr.docChanged && prev.text) {
              return { text: "", decorations: DecorationSet.empty };
            }

            if (prev.decorations && !tr.docChanged) {
              return {
                text: prev.text,
                decorations: prev.decorations.map(tr.mapping, tr.doc),
              };
            }

            return prev;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)?.decorations || DecorationSet.empty;
          },
        },
      }),
    ];
  },
});
