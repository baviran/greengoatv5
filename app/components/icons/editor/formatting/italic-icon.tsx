import * as React from "react"
import { IconProps } from "../../types"

export const ItalicIcon = React.memo<IconProps>(
  ({ className, size = 24, ...props }) => {
    return (
      <svg
        width={size}
        height={size}
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M15 4C15.5523 4 16 4.44772 16 5C16 5.55228 15.5523 6 15 6H11.8L9.7 18H13C13.5523 18 14 18.4477 14 19C14 19.5523 13.5523 20 13 20H8C7.44772 20 7 19.5523 7 19C7 18.4477 7.44772 18 8 18H8.2L10.3 6H9C8.44772 6 8 5.55228 8 5C8 4.44772 8.44772 4 9 4H15Z"
          fill="currentColor"
        />
      </svg>
    )
  }
)

ItalicIcon.displayName = "ItalicIcon" 