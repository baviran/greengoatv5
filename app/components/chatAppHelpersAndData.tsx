import { Sun, Moon, PlusSquare, User, Settings, Trash2, Edit3, Bot, Send, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { IconProps } from '../types/chat';

export const Icon: React.FC<IconProps> = ({ name, className, ...props }) => {
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
    };
    return icons[name] || null;
};

export const assistantData = {
    id: 'asst_4OCphfGQ5emHha8ERVPYOjl6',
    name: 'עוזר וירטואלי',
    description: 'אני כאן כדי לעזור לך עם כל שאלה שיש לך.',
};
