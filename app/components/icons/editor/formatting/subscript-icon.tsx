import * as React from "react"
import { IconProps } from "../../types"

export const SubscriptIcon = React.memo<IconProps>(
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
          d="M16.5 13.5H21.5V15H18.5V16.5H20.5C21.0523 16.5 21.5 16.9477 21.5 17.5V19.5C21.5 20.0523 21.0523 20.5 20.5 20.5H16.5C15.9477 20.5 15.5 20.0523 15.5 19.5V18.5C15.5 18.2239 15.6158 17.9613 15.8232 17.7678L18.5 15.5V13.5C18.5 12.9477 18.9477 12.5 19.5 12.5H20.5C21.0523 12.5 21.5 12.9477 21.5 13.5V14.5H20V13.5H19.5V15.5H21.5V17H17V18.5H20V19.5H16.5V13.5Z"
          fill="currentColor"
        />
      </svg>
    )
  }
)

SubscriptIcon.displayName = "SubscriptIcon" 