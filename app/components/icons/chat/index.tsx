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

// Google icon component
const GoogleIconComponent: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    {...props}
  >
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

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
    google: <GoogleIconComponent className={className} {...props} />,
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
export const GoogleIcon = GoogleIconComponent 