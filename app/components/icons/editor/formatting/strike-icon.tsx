import * as React from "react"
import { IconProps } from "../../types"

export const StrikeIcon = React.memo<IconProps>(
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
          d="M17.154 14C18.23 15.099 18.768 16.467 18.768 18.105C18.768 19.743 18.23 21.111 17.154 22.209C16.154 23.307 14.616 23.856 12.54 23.856C10.464 23.856 8.926 23.307 7.926 22.209C6.85 21.111 6.312 19.743 6.312 18.105C6.312 16.467 6.85 15.099 7.926 14H17.154ZM12.54 0.144C14.616 0.144 16.154 0.693 17.154 1.791C18.23 2.889 18.768 4.257 18.768 5.895C18.768 7.533 18.23 8.901 17.154 9.999H7.926C6.85 8.901 6.312 7.533 6.312 5.895C6.312 4.257 6.85 2.889 7.926 1.791C8.926 0.693 10.464 0.144 12.54 0.144Z"
          fill="currentColor"
        />
        <path
          d="M3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12Z"
          fill="currentColor"
        />
      </svg>
    )
  }
)

StrikeIcon.displayName = "StrikeIcon" 