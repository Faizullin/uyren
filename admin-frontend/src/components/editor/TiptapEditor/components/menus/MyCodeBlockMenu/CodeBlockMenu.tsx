import React, { memo, useCallback } from "react";
import { BubbleMenu } from "../../BubbleMenu";
import { Toolbar, ToolbarDivider } from "../../ui/Toolbar";
import { useTiptapContext } from "../../Provider";
import MenuButton from "../../MenuButton";
import { useEditorState } from "@tiptap/react";
import CodeDropdown from "./CodeDropdown";
import useCopyToClipboard from "../../../hooks/useCopyToClipboard";
import { getNodeContainer } from "../../../utils/getNodeContainer";
import useModal from "../../../hooks/useModal";
import Dialog from "../../ui/Dialog";
import { CodeExecuteButton } from "@/components/code/code-execute-button";

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

  const { open, handleOpen, handleClose } = useModal();
  const handleSettings = useCallback(() => {
    handleOpen();
  }, [editor, handleOpen]);

  const handleCopy = useCallback(() => {
    const node = getNodeContainer(editor, "pre");
    if (node?.textContent) {
      copy(node.textContent);
    }
  }, [editor]);

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
      <Dialog open={open} onOpenChange={handleClose}>
        Hi
      </Dialog>
    </BubbleMenu>
  );
};

export default memo(CodeBlockMenu);
