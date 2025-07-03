import * as React from "react"
import { IconProps } from "../../types"

export const SuperscriptIcon = React.memo<IconProps>(
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
          d="M5.52 7H3.7L7.78 12.33L3.27 18H5.09L8.6 13.67L12.11 18H13.93L9.42 12.33L13.5 7H11.68L8.6 10.67L5.52 7Z"
          fill="currentColor"
        />
        <path
          d="M16.5 3.5H21.5V5H18.5V6.5H20.5C21.0523 6.5 21.5 6.94772 21.5 7.5V9.5C21.5 10.0523 21.0523 10.5 20.5 10.5H16.5C15.9477 10.5 15.5 10.0523 15.5 9.5V8.5C15.5 8.22386 15.6158 7.96129 15.8232 7.76777L18.5 5.5V3.5C18.5 2.94772 18.9477 2.5 19.5 2.5H20.5C21.0523 2.5 21.5 2.94772 21.5 3.5V4.5H20V3.5H19.5V5.5H21.5V7H17V8.5H20V9.5H16.5V3.5Z"
          fill="currentColor"
        />
      </svg>
    )
  }
)

SuperscriptIcon.displayName = "SuperscriptIcon" 