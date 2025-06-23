import { MediaLibraryDialog } from "@/components/editor/media-gallery/media-library-dialog";
import useModal from "@/components/editor/TiptapEditor/hooks/useModal";
import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";


const ImageButton = () => {
  const { editor } = useTiptapContext();
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        active: ctx.editor.isActive("image"),
        disabled: !ctx.editor.isEditable,
      };
    },
  });

  const { open, handleOpen, handleClose } = useModal();


  return (
    <>
      <MenuButton icon="Image" tooltip="Image" {...state} onClick={handleOpen} />
      {/* <Dialog open={open} onOpenChange={handleClose}>
        <MediaLibrary onClose={handleClose} onInsert={(image) => {
          editor
            .chain()
            .focus()
            .insertImage({
              src: image.url,
              // width: image.width,
              // height: image.height,
            })
            .run();
          handleClose();
        }} />
      </Dialog> */}
      <MediaLibraryDialog
        open={open}
        onOpenChange={(v) => v ? handleOpen() : handleClose()}
        onInsert={(image) => {
          editor
            .chain()
            .focus()
            .insertImage({
              src: image.url,
              alt: image.alt_text || image.title,
            })
            .run();
          handleClose();
        }}
        config={{
          initialFileType: "image",
        }}
      />
    </>
  );
};

export default ImageButton;
