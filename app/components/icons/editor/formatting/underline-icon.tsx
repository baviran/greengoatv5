import * as React from "react"
import { IconProps } from "../../types"

export const UnderlineIcon = React.memo<IconProps>(
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
          d="M6 3C6.55228 3 7 3.44772 7 4V11C7 13.7614 9.23858 16 12 16C14.7614 16 17 13.7614 17 11V4C17 3.44772 17.4477 3 18 3C18.5523 3 19 3.44772 19 4V11C19 14.866 15.866 18 12 18C8.13401 18 5 14.866 5 11V4C5 3.44772 5.44772 3 6 3Z"
          fill="currentColor"
        />
        <path
          d="M3 20C3 19.4477 3.44772 19 4 19H20C20.5523 19 21 19.4477 21 20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20Z"
          fill="currentColor"
        />
      </svg>
    )
  }
)

UnderlineIcon.displayName = "UnderlineIcon" 