"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/app/hooks/tiptap/use-tiptap-editor"

// --- Icons ---
import { PageBreakIcon } from "@/app/components/tiptap/tiptap-icons/page-break-icon"

// --- UI Primitives ---
import type { ButtonProps } from "@/app/components/tiptap/tiptap-ui-primitive/button"
import { Button } from "@/app/components/tiptap/tiptap-ui-primitive/button"

export interface PageBreakButtonProps extends Omit<ButtonProps, "type"> {
  /**
   * The TipTap editor instance.
   */
  editor?: Editor | null
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
  /**
   * Whether to hide the button when the command is not available.
   */
  hideWhenUnavailable?: boolean
  /**
   * Whether the button should be disabled.
   */
  disabled?: boolean
}

export function usePageBreakState(
  editor: Editor | null,
  disabled?: boolean,
  hideWhenUnavailable?: boolean
) {
  const isCommandAvailable = React.useMemo(() => {
    if (!editor) return false
    return editor.can().setPageBreak()
  }, [editor])

  const isDisabled = React.useMemo(() => {
    return !editor || disabled || !isCommandAvailable
  }, [editor, disabled, isCommandAvailable])

  const shouldShow = React.useMemo(() => {
    if (!editor) return false
    if (hideWhenUnavailable && !isCommandAvailable) return false
    return true
  }, [editor, hideWhenUnavailable, isCommandAvailable])

  const handleClick = React.useCallback(() => {
    if (!editor || isDisabled) return
    editor.chain().focus().setPageBreak().run()
  }, [editor, isDisabled])

  return {
    isDisabled,
    shouldShow,
    handleClick,
  }
}

export const PageBreakButton = React.forwardRef<
  HTMLButtonElement,
  PageBreakButtonProps
>(
  (
    {
      editor: providedEditor,
      text,
      hideWhenUnavailable = false,
      disabled,
      className = "",
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const editor = useTiptapEditor(providedEditor)
    const { isDisabled, shouldShow, handleClick } = usePageBreakState(
      editor,
      disabled,
      hideWhenUnavailable
    )

    const handleButtonClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)

        if (!e.defaultPrevented && !isDisabled) {
          handleClick()
        }
      },
      [onClick, isDisabled, handleClick]
    )

    if (!shouldShow || !editor || !editor.isEditable) {
      return null
    }

    return (
      <Button
        type="button"
        className={className.trim()}
        disabled={isDisabled}
        data-style="ghost"
        data-disabled={isDisabled}
        role="button"
        tabIndex={-1}
        aria-label="Insert page break"
        tooltip="Insert page break"
        shortcutKeys="Mod+Enter"
        onClick={handleButtonClick}
        {...buttonProps}
        ref={ref}
      >
        {children || (
          <>
            <PageBreakIcon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
          </>
        )}
      </Button>
    )
  }
)

PageBreakButton.displayName = "PageBreakButton"

export default PageBreakButton 