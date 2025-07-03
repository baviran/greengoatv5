import * as React from "react"
import { 
  Sun, 
  Moon, 
  PlusSquare, 
  User, 
  Settings, 
  Trash2, 
  Edit3, 
  Bot, 
  Send, 
  Loader2, 
  ThumbsUp, 
  ThumbsDown 
} from 'lucide-react'
import { ChatIconProps } from "../types"

export const ChatIcon: React.FC<ChatIconProps> = ({ name, className, ...props }) => {
  const icons = {
    sun: <Sun className={className} {...props} />,
    moon: <Moon className={className} {...props} />,
    plusSquare: <PlusSquare className={className} {...props} />,
    user: <User className={className} {...props} />,
    settings: <Settings className={className} {...props} />,
    trash2: <Trash2 className={className} {...props} />,
    edit3: <Edit3 className={className} {...props} />,
    bot: <Bot className={className} {...props} />,
    send: <Send className={className} {...props} />,
    loader2: <Loader2 className={className} {...props} />,
    thumbsUp: <ThumbsUp className={className} {...props} />,
    thumbsDown: <ThumbsDown className={className} {...props} />,
  }
  return icons[name] || null
}

// Individual exports for direct usage
export const SunIcon = Sun
export const MoonIcon = Moon
export const PlusSquareIcon = PlusSquare
export const UserIcon = User
export const SettingsIcon = Settings
export const Trash2Icon = Trash2
export const Edit3Icon = Edit3
export const BotIcon = Bot
export const SendIcon = Send
export const Loader2Icon = Loader2
export const ThumbsUpIcon = ThumbsUp
export const ThumbsDownIcon = ThumbsDown 