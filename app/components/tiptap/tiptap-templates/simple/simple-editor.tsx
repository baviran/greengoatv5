"use client"

import * as React from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Extensions ---
import { getTiptapExtensions } from "@/app/lib/tiptap/tiptap-extensions"

// --- Custom Extensions ---
// import { Link } from "@/app/components/tiptap/tiptap-extension/link-extension"
import { Selection } from "@/app/components/tiptap/tiptap-extension/selection-extension"
import { TrailingNode } from "@/app/components/tiptap/tiptap-extension/trailing-node-extension"

// --- UI Primitives ---
import { Button } from "@/app/components/tiptap/tiptap-ui-primitive/button"
import { Spacer } from "@/app/components/tiptap/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/app/components/tiptap/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/app/components/tiptap/tiptap-node/image-upload-node/image-upload-node-extension"
import "@/app/components/tiptap/tiptap-node/code-block-node/code-block-node.scss"
import "@/app/components/tiptap/tiptap-node/list-node/list-node.scss"
import "@/app/components/tiptap/tiptap-node/image-node/image-node.scss"
import "@/app/components/tiptap/tiptap-node/paragraph-node/paragraph-node.scss"
import "@/app/components/tiptap/tiptap-node/page-break-node/page-break-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/app/components/tiptap/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/app/components/tiptap/tiptap-ui/image-upload-button"
import { PDFDownloadButton } from "@/app/components/tiptap/tiptap-ui/pdf-download-button"
import { ListDropdownMenu } from "@/app/components/tiptap/tiptap-ui/list-dropdown-menu"
import { BlockQuoteButton } from "@/app/components/tiptap/tiptap-ui/blockquote-button"
import { PageBreakButton } from "@/app/components/tiptap/tiptap-ui/page-break-button"

import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/app/components/tiptap/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/app/components/tiptap/tiptap-ui/link-popover"
import { MarkButton } from "@/app/components/tiptap/tiptap-ui/mark-button"
import { TextAlignButton } from "@/app/components/tiptap/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/app/components/tiptap/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/app/components/tiptap/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/app/components/tiptap/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/app/components/tiptap/tiptap-icons/link-icon"

// --- Hooks ---
import { useMobile } from "@/app/hooks/tiptap/use-mobile"
import { useWindowSize } from "@/app/hooks/tiptap/use-window-size"
import { useCursorVisibility } from "@/app/hooks/tiptap/use-cursor-visibility"

// --- Components ---


// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/app/lib/tiptap/tiptap-utils"

// --- Styles ---
import "@/app/components/tiptap/tiptap-templates/simple/simple-editor.scss"

import content from "@/app/components/tiptap/tiptap-templates/simple/data/content.json"

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  return (
    <>
      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} />
        <ListDropdownMenu types={["bulletList", "orderedList"]} />
        <BlockQuoteButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="הוסף" />
        <PageBreakButton />
        <PDFDownloadButton />
      </ToolbarGroup>

      <Spacer />
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function SimpleEditor() {
  const isMobile = useMobile()
  const windowSize = useWindowSize()
  const [mobileView, setMobileView] = React.useState<
    "main" | "highlighter" | "link"
  >("main")
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
      },
    },
    extensions: [
      ...getTiptapExtensions(),
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      TrailingNode,
    ],
    content: content,
  })

  const bodyRect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  return (
    <EditorContext.Provider value={{ editor }}>
      <Toolbar
        ref={toolbarRef}
        style={
          isMobile
            ? {
                bottom: `calc(100% - ${windowSize.height - bodyRect.y}px)`,
              }
            : {}
        }
      >
        {mobileView === "main" ? (
          <MainToolbarContent
            onHighlighterClick={() => setMobileView("highlighter")}
            onLinkClick={() => setMobileView("link")}
            isMobile={isMobile}
          />
        ) : (
          <MobileToolbarContent
            type={mobileView === "highlighter" ? "highlighter" : "link"}
            onBack={() => setMobileView("main")}
          />
        )}
      </Toolbar>

      <div className="content-wrapper">
        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </div>
    </EditorContext.Provider>
  )
}
