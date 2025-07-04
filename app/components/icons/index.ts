// === TYPES ===
export type { IconProps, IconComponent, ChatIconName, ChatIconProps } from './types'

// === EDITOR ICONS ===

// Formatting icons
export { BoldIcon } from './editor/formatting/bold-icon'
export { ItalicIcon } from './editor/formatting/italic-icon'
export { StrikeIcon } from './editor/formatting/strike-icon'
export { UnderlineIcon } from './editor/formatting/underline-icon'
export { CodeIcon } from './editor/formatting/code-icon'
export { HighlighterIcon } from './editor/formatting/highlighter-icon'
export { SuperscriptIcon } from './editor/formatting/superscript-icon'
export { SubscriptIcon } from './editor/formatting/subscript-icon'

// Alignment icons
export { AlignLeftIcon } from './editor/alignment/align-left-icon'
export { AlignCenterIcon } from './editor/alignment/align-center-icon'
export { AlignRightIcon } from './editor/alignment/align-right-icon'
export { AlignJustifyIcon } from './editor/alignment/align-justify-icon'

// Action icons
export { UndoIcon } from './editor/actions/undo-icon'
export { RedoIcon } from './editor/actions/redo-icon'

// Heading icons
export { HeadingIcon } from './editor/headings/heading-icon'
export { Heading1Icon } from './editor/headings/heading-1-icon'

// Navigation icons
export { ArrowLeftIcon } from './editor/navigation/arrow-left-icon'
export { ChevronDownIcon } from './editor/navigation/chevron-down-icon'

// Content icons
export { LinkIcon } from './editor/content/link-icon'
export { ImagePlusIcon } from './editor/content/image-plus-icon'

// List icons
export { ListIcon } from './editor/lists/list-icon'

// Block icons
export { BlockQuoteIcon } from './editor/blocks/block-quote-icon'

// Additional heading icons
export { Heading2Icon } from './editor/headings/heading-2-icon'

// === CHAT ICONS ===
export { 
  ChatIcon,
  SunIcon,
  MoonIcon,
  PlusSquareIcon,
  UserIcon,
  SettingsIcon,
  Trash2Icon,
  Edit3Icon,
  BotIcon,
  SendIcon,
  Loader2Icon,
  ThumbsUpIcon,
  ThumbsDownIcon
} from './chat'

// === LEGACY ALIASES ===
// For backward compatibility with existing TipTap imports
export { CodeIcon as Code2Icon } from './editor/formatting/code-icon'
export { UndoIcon as Undo2Icon } from './editor/actions/undo-icon'
export { RedoIcon as Redo2Icon } from './editor/actions/redo-icon'
export { Heading1Icon as HeadingOneIcon } from './editor/headings/heading-1-icon'
export { Heading2Icon as HeadingTwoIcon } from './editor/headings/heading-2-icon'

// === ORGANIZED GROUPS ===
import { BoldIcon } from './editor/formatting/bold-icon'
import { ItalicIcon } from './editor/formatting/italic-icon'
import { StrikeIcon } from './editor/formatting/strike-icon'
import { UnderlineIcon } from './editor/formatting/underline-icon'
import { CodeIcon } from './editor/formatting/code-icon'
import { HighlighterIcon } from './editor/formatting/highlighter-icon'
import { SuperscriptIcon } from './editor/formatting/superscript-icon'
import { SubscriptIcon } from './editor/formatting/subscript-icon'
import { AlignLeftIcon } from './editor/alignment/align-left-icon'
import { AlignCenterIcon } from './editor/alignment/align-center-icon'
import { AlignRightIcon } from './editor/alignment/align-right-icon'
import { AlignJustifyIcon } from './editor/alignment/align-justify-icon'
import { UndoIcon } from './editor/actions/undo-icon'
import { RedoIcon } from './editor/actions/redo-icon'
import { ArrowLeftIcon } from './editor/navigation/arrow-left-icon'
import { ChevronDownIcon } from './editor/navigation/chevron-down-icon'
import { HeadingIcon } from './editor/headings/heading-icon'
import { Heading1Icon } from './editor/headings/heading-1-icon'

export const FormattingIcons = {
  Bold: BoldIcon,
  Italic: ItalicIcon,
  Strike: StrikeIcon,
  Underline: UnderlineIcon,
  Code: CodeIcon,
  Highlighter: HighlighterIcon,
  Superscript: SuperscriptIcon,
  Subscript: SubscriptIcon,
}

export const AlignmentIcons = {
  Left: AlignLeftIcon,
  Center: AlignCenterIcon,
  Right: AlignRightIcon,
  Justify: AlignJustifyIcon,
}

export const ActionIcons = {
  Undo: UndoIcon,
  Redo: RedoIcon,
}

export const NavigationIcons = {
  ArrowLeft: ArrowLeftIcon,
  ChevronDown: ChevronDownIcon,
}

export const HeadingIcons = {
  Heading: HeadingIcon,
  H1: Heading1Icon,
}

// === COMPATIBILITY IMPORT ===
// Backward compatibility with existing chat icon usage
export { ChatIcon as Icon } from './chat' 