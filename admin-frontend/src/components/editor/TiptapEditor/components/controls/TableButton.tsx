import TableBuilder from "@/components//editor/TiptapEditor/components/TableBuilder";
import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const TableButton = () => {
  const { editor } = useTiptapContext();
  const state = useEditorState({
    editor,
    selector: () => {
      return {
        // disabled: !ctx.editor.can().insertTable(),
      };
    },
  });

  return (
    <MenuButton
      icon="Table"
      tooltip="Table"
      type="popover"
      hideArrow
      {...state}
    >
      <TableBuilder
        onCreate={({ rows, cols }) => editor.chain().insertTable({ rows, cols, withHeaderRow: false }).focus().run()}
      />
    </MenuButton>
  );
};

export default TableButton;
