import * as React from "react"
import { IconProps } from "../../types"

export const HeadingIcon = React.memo<IconProps>(
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
          d="M6 4C6.55228 4 7 4.44772 7 5V10H17V5C17 4.44772 17.4477 4 18 4C18.5523 4 19 4.44772 19 5V19C19 19.5523 18.5523 20 18 20C17.4477 20 17 19.5523 17 19V12H7V19C7 19.5523 6.55228 20 6 20C5.44772 20 5 19.5523 5 19V5C5 4.44772 5.44772 4 6 4Z"
          fill="currentColor"
        />
      </svg>
    )
  }
)

HeadingIcon.displayName = "HeadingIcon" 