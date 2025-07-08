export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

export interface IconComponent {
  (props: IconProps): React.JSX.Element;
  displayName?: string;
}

// Chat icon names for backward compatibility
export type ChatIconName = 
  | 'sun' 
  | 'moon' 
  | 'plusSquare' 
  | 'user' 
  | 'settings' 
  | 'trash2' 
  | 'edit3' 
  | 'bot' 
  | 'send' 
  | 'loader2' 
  | 'thumbsUp' 
  | 'thumbsDown'
  | 'google';

export interface ChatIconProps {
  name: ChatIconName;
  className?: string;
  [key: string]: any;
} 