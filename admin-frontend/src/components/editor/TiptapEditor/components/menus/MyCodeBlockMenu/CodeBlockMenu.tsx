import { CodeBlockSettingsNiceDialog, Settings } from "@/components/code/code-block-settings-nice-dialog";
import { CodeExecuteButton } from "@/components/code/code-execute-button";
import { showComponentNiceDialog } from "@/lib/nice-dialog";
import { useEditorState } from "@tiptap/react";
import { memo, useCallback } from "react";
import useCopyToClipboard from "../../../hooks/useCopyToClipboard";
import { getNodeContainer } from "../../../utils/getNodeContainer";
import { BubbleMenu } from "../../BubbleMenu";
import MenuButton from "../../MenuButton";
import { useTiptapContext } from "../../Provider";
import { Toolbar, ToolbarDivider } from "../../ui/Toolbar";
import CodeDropdown from "./CodeDropdown";

export const CodeBlockMenu = () => {
  const { editor, contentElement } = useTiptapContext();
  const { isCopied, copy } = useCopyToClipboard();

  const language = useEditorState({
    editor,
    selector: (ctx) => {
      if (ctx.editor.isActive("codeBlock")) return ctx.editor.getAttributes("codeBlock").language;
      return null;
    },
  });

  const codeContent = useEditorState({
    editor,
    selector: (ctx) => {
      if (ctx.editor.isActive("codeBlock")) {
        const node = getNodeContainer(ctx.editor, "pre");
        return node?.textContent || "";
      }
      return "";
    },
  });

  const shouldShow = useCallback(({ editor }: any) => {
    return editor.isActive("codeBlock");
  }, []);

  const handleSelect = useCallback(
    (value: string) => editor.commands.updateAttributes("codeBlock", { language: value }),
    [editor]
  );
  const handleSettings = useCallback(() => {
    const attrs = editor.getAttributes("codeBlock");
    const settings: Settings = {
      can_edit: false,
      can_run: false,
      can_open_editor: false,
      render_type: "code",
      ...(attrs.settings || {}),
      language: attrs.language || "javascript",
    };
    const docs = document.querySelectorAll(".code-block-bubble-menu");
    docs.forEach((el) => {
      el.classList.add("hidden");
    });
    showComponentNiceDialog<{
      record: Settings;
    }>(CodeBlockSettingsNiceDialog, {
      args: {
        settings: settings,
      }
    }).then((res) => {
      if (res?.result?.record) {
        editor.chain().focus().updateAttributes("codeBlock", {
          settings: res.result.record,
          language: res.result.record.language,
        }).run();
      }
    }).finally(console.log).finally(() => {
      docs.forEach((el) => {
        el.classList.remove("hidden");
      });
    });
  }, [editor]);

  const handleCopy = useCallback(() => {
    const node = getNodeContainer(editor, "pre");
    if (node?.textContent) {
      copy(node.textContent);
    }
  }, [copy, editor]);

  const handleDelete = useCallback(() => {
    editor.chain().focus().deleteNode("codeBlock").run();
  }, [editor]);

  const getReferenceClientRect = useCallback(() => {
    const node = getNodeContainer(editor, "pre");
    return node?.getBoundingClientRect() || new DOMRect(-1000, -1000, 0, 0);
  }, [editor]);

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={"code-block-bubble"}
      shouldShow={shouldShow}
      updateDelay={100}
      tippyOptions={{
        placement: "top",
        maxWidth: "auto",
        appendTo: () => contentElement.current!,
        getReferenceClientRect,
      }}
      className="code-block-bubble-menu"
    >
      <Toolbar>
        <CodeDropdown value={language} onSelect={handleSelect} />
        <MenuButton
          icon={"Settings"}
          tooltip="Settings"
          onClick={handleSettings}
        />
        <ToolbarDivider />
        {codeContent && language && (
          <>
            <CodeExecuteButton
              code={codeContent}
              language={language || 'javascript'}
              size="sm"
              variant="outline"
            />
            <ToolbarDivider />
          </>
        )}
        <MenuButton
          icon={isCopied ? "Check" : "Clipboard"}
          tooltip="Copy code"
          onClick={handleCopy}
        />
        <MenuButton icon="Trash" tooltip="Delete code" onClick={handleDelete} />
      </Toolbar>
    </BubbleMenu>
  );
};

export default memo(CodeBlockMenu);
