# Unified Icon System

A comprehensive, organized, and type-safe icon system for the entire application.

## 🎯 Overview

This unified icon system consolidates all app icons into a single, well-organized structure:

- **39 TipTap Editor Icons** - Now organized by category
- **12 Chat Interface Icons** - Migrated from Lucide React
- **5 Static SVG Assets** - Maintained in `/public` folder
- **Full TypeScript Support** - Complete type safety
- **Tree Shaking** - Import only what you use
- **Backward Compatibility** - Existing imports continue to work

## 📁 Structure

```
app/components/icons/
├── types.ts                    # TypeScript definitions
├── index.ts                    # Main export file
├── README.md                   # This file
├── editor/                     # TipTap editor icons
│   ├── formatting/             # Bold, italic, strike, etc.
│   ├── alignment/              # Text alignment icons
│   ├── actions/                # Undo, redo, etc.
│   ├── headings/               # Heading icons
│   └── navigation/             # Arrows, chevrons
└── chat/                       # Chat interface icons
    └── index.tsx               # Lucide React wrapper
```

## 🚀 Usage

### Simple Import (Recommended)
```tsx
import { BoldIcon, ItalicIcon, SendIcon } from '@/app/components/icons'

// Use with consistent API
<BoldIcon className="text-blue-500" size={20} />
<ItalicIcon className="text-gray-600" />
<SendIcon className="text-green-500" size={24} />
```

### Category-Based Import
```tsx
import { FormattingIcons, ChatIcon } from '@/app/components/icons'

// Use from organized groups
<FormattingIcons.Bold className="text-blue-500" />
<FormattingIcons.Italic className="text-gray-600" />

// Chat icons (backward compatible)
<ChatIcon name="send" className="text-green-500" />
```

### TypeScript Support
```tsx
import { IconProps } from '@/app/components/icons'

const CustomButton: React.FC<{ icon: React.ComponentType<IconProps> }> = ({ icon: Icon }) => (
  <button>
    <Icon size={16} className="mr-2" />
    Click me
  </button>
)
```

## 🔄 Migration Guide

### From TipTap Icons
**Before:**
```tsx
import { BoldIcon } from "@/app/components/tiptap/tiptap-icons/bold-icon"
import { ItalicIcon } from "@/app/components/tiptap/tiptap-icons/italic-icon"
```

**After:**
```tsx
import { BoldIcon, ItalicIcon } from "@/app/components/icons"
```

### From Chat Icons
**Before:**
```tsx
import { Icon } from './chatAppHelpersAndData'
<Icon name="send" className="text-blue-500" />
```

**After:**
```tsx
import { SendIcon } from "@/app/components/icons"
<SendIcon className="text-blue-500" />
```

## 📦 Icon Categories

### Formatting Icons
- `BoldIcon`, `ItalicIcon`, `StrikeIcon`, `UnderlineIcon`
- `CodeIcon`, `HighlighterIcon`
- `SuperscriptIcon`, `SubscriptIcon`

### Alignment Icons
- `AlignLeftIcon`, `AlignCenterIcon`, `AlignRightIcon`, `AlignJustifyIcon`

### Action Icons
- `UndoIcon`, `RedoIcon`

### Navigation Icons
- `ArrowLeftIcon`, `ChevronDownIcon`

### Heading Icons
- `HeadingIcon`, `Heading1Icon`

### Chat Icons
- `BotIcon`, `SendIcon`, `UserIcon`, `SettingsIcon`
- `ThumbsUpIcon`, `ThumbsDownIcon`
- `SunIcon`, `MoonIcon`

## 🎨 Icon API

All icons support a consistent API:

```tsx
interface IconProps {
  className?: string
  size?: number | string  // Default: 24
  // ...all standard SVG props
}
```

## 🔧 Adding New Icons

1. **Create the icon file** in the appropriate category:
   ```tsx
   // app/components/icons/editor/formatting/new-icon.tsx
   import * as React from "react"
   import { IconProps } from "../../types"
   
   export const NewIcon = React.memo<IconProps>(
     ({ className, size = 24, ...props }) => (
       <svg width={size} height={size} className={className} {...props}>
         {/* SVG content */}
       </svg>
     )
   )
   ```

2. **Export from index.ts**:
   ```tsx
   export { NewIcon } from './editor/formatting/new-icon'
   ```

## ✅ Benefits

- **Single Import Source** - One place for all icons
- **Type Safety** - Full TypeScript support
- **Tree Shaking** - Only imports what you use
- **Consistent API** - Same props across all icons
- **Organized Structure** - Icons grouped by purpose
- **Backward Compatible** - Existing code continues to work
- **Performance** - Optimized SVG components

## 🎯 Next Steps

1. **Complete Migration** - Move remaining TipTap icons to new structure
2. **Update All Imports** - Replace old imports with new unified imports
3. **Clean Up** - Remove old icon files after migration
4. **Documentation** - Update component documentation to use new icons 