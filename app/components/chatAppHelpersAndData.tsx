import { Sun, Moon, PlusSquare, User, Settings, Trash2, Edit3, Bot, Send } from 'lucide-react';
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
    };
    return icons[name] || null;
};

export const assistantData = {
    id: 'asst_123xyz',
    name: 'עוזר וירטואלי',
    description: 'אני כאן כדי לעזור לך עם כל שאלה שיש לך.',
};

export const mockThreads = [
    { id: 'thread_1', title: 'דיון על מזג האוויר הנוכחי' },
    { id: 'thread_2', title: 'מתכונים מהירים לארוחת ערב קלה' },
];

export const mockMessages = [
    { id: 'msg_t1_1', threadId: 'thread_1', sender: 'user', text: 'היי, מה התחזית להיום?', timestamp: '09:30' },
    { id: 'msg_t1_2', threadId: 'thread_1', sender: 'assistant', text: 'היום צפוי להיות חם מהרגיל עם טמפרטורות גבוהות.', timestamp: '09:31' },
    { id: 'msg_t1_3', threadId: 'thread_1', sender: 'user', text: 'האם יש סיכוי לגשם?', timestamp: '09:32' },
    { id: 'msg_t1_4', threadId: 'thread_1', sender: 'assistant', text: 'לא צפוי גשם בימים הקרובים.', timestamp: '09:33' },
    { id: 'msg_t1_5', threadId: 'thread_1', sender: 'user', text: 'תודה רבה!', timestamp: '09:35' },
    { id: 'msg_t1_6', threadId: 'thread_1', sender: 'user', text: 'מה לגבי הרוח? צפויה רוח חזקה?', timestamp: '14:00' },
    { id: 'msg_t1_7', threadId: 'thread_1', sender: 'assistant', text: 'הרוח תהיה מתונה היום.', timestamp: '14:01' },
    { id: 'msg_t1_8', threadId: 'thread_1', sender: 'user', text: 'ואחוזי לחות?', timestamp: '14:02' },
    { id: 'msg_t1_9', threadId: 'thread_1', sender: 'assistant', text: 'אחוזי הלחות יהיו גבוהים יחסית, במיוחד באזור החוף.', timestamp: '14:03' },
    { id: 'msg_t1_10', threadId: 'thread_1', sender: 'user', text: 'הבנתי, תודה על המידע המפורט!', timestamp: '14:05' },
    { id: 'msg_t1_11', threadId: 'thread_1', sender: 'assistant', text: 'בשמחה! יום נעים.', timestamp: '14:06' },
    { id: 'msg_t1_12', threadId: 'thread_1', sender: 'user', text: 'יום נעים גם לך!', timestamp: '14:07' },
];
