import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";
import { DropdownMenuItem } from "../ui/DropdownMenu";

const InsertDropdown = () => {
  const { editor } = useTiptapContext();

  const insertCodeBlock = () => editor.chain().focus().setCodeBlock().run();

  const insertBlockquote = () => editor.chain().focus().setBlockquote().run();

  const insertYoutube = () => {
    const src = prompt("Embed Youtube Video", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    if (src) {
      editor.chain().focus().embedYoutube({ src }).run();
    }
  };

  return (
    <MenuButton
      type="dropdown"
      tooltip="Insert"
      disabled={!editor.isEditable}
      icon="Plus"
      dropdownStyle={{ minWidth: "8rem" }}
    >
      <DropdownMenuItem asChild>
        <MenuButton
          text="Blockquote"
          hideText={false}
          tooltip={false}
          icon="Quote"
          onClick={insertBlockquote}
        />
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <MenuButton
          text="Code block"
          hideText={false}
          tooltip={false}
          icon="CodeBlock"
          onClick={insertCodeBlock}
        />
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <MenuButton
          text="Youtube"
          hideText={false}
          tooltip={false}
          icon="Youtube"
          onClick={insertYoutube}
        />
      </DropdownMenuItem>
    </MenuButton>
  );
};

export default InsertDropdown;
