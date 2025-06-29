import { ExtendedRegExpMatchArray, isNodeActive, textblockTypeInputRule } from "@tiptap/react";
import { CodeBlockLowlight as TiptapCodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { findLanguage, loadLanguage } from "../../utils/codeLanguageLoader";
import { LowlightPlugin } from "./lowlight-plugin";
import { CODE_BLOCK_LANGUAGUE_SYNTAX_DEFAULT } from "../../constants/code-languages";
import { CodeBlockComponent } from "./CodeBlockComponent";

import { createLowlight } from "lowlight";
import plaintext from "highlight.js/lib/languages/plaintext";

export const backtickInputRegex = /^```([a-z]+)?[\s\n]$/;
export const tildeInputRegex = /^~~~([a-z]+)?[\s\n]$/;

const lowlight = createLowlight();
lowlight.register("plaintext", plaintext);

export const CodeBlock = TiptapCodeBlockLowlight.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      defaultLanguage: CODE_BLOCK_LANGUAGUE_SYNTAX_DEFAULT,
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      settings: {
        default: {
          can_edit: false,
          can_run: false,
          can_open_editor: false,
          render_type: "code",
        },
        parseHTML: (element) => {
          const settings = element.getAttribute("data-settings");
          return settings ? JSON.parse(settings) : {
            can_edit: false,
            can_run: false,
            can_open_editor: false,
            render_type: "code",
          };
        },
        renderHTML: (attributes) => {
          if (!attributes.settings) return {};
          return {
            "data-settings": JSON.stringify(attributes.settings),
          };
        },
      },
    };
  },

  addInputRules() {
    const findAndLoadLanguage = (match: ExtendedRegExpMatchArray) => {
      const language = findLanguage(match[1]);
      const syntax = language?.syntax || CODE_BLOCK_LANGUAGUE_SYNTAX_DEFAULT;
      loadLanguage(syntax, lowlight);
      return { language: syntax };
    };

    return [
      textblockTypeInputRule({
        find: backtickInputRegex,
        type: this.type,
        getAttributes: findAndLoadLanguage,
      }),
      textblockTypeInputRule({
        find: tildeInputRegex,
        type: this.type,
        getAttributes: findAndLoadLanguage,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },

  addProseMirrorPlugins() {
    return [
      LowlightPlugin({
        lowlight,
        name: this.name,
        defaultLanguage: CODE_BLOCK_LANGUAGUE_SYNTAX_DEFAULT,
      }),
    ];
  },

  //   renderHTML({ node }) {
  //     return [
  //       "pre",
  //       {
  //         "data-language": node.attrs.language ?? null,
  //       },
  //       [
  //         "code",
  //         //   {
  //         //     "data-language": node.attrs.language ?? null,
  //         //   },
  //         0,
  //       ],
  //     ];
  //   },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Tab: ({ editor }) => {
        const { state, view } = editor;
        if (isNodeActive(editor.state, this.type)) {
          view.dispatch(state.tr.insertText("\t"));
          return true;
        }
        return false;
      },
    };
  },
}).configure({
  lowlight,
});
