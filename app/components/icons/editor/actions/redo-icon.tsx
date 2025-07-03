import * as React from "react"
import { IconProps } from "../../types"

export const RedoIcon = React.memo<IconProps>(
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
          fillRule="evenodd"
          clipRule="evenodd"
          d="M18.2071 7.79289C18.5976 8.18342 18.5976 8.81658 18.2071 9.20711L16.9142 10.5H13C10.2386 10.5 8 12.7386 8 15.5C8 18.2614 10.2386 20.5 13 20.5H15C15.5523 20.5 16 20.0523 16 19.5C16 18.9477 15.5523 18.5 15 18.5H13C11.3431 18.5 10 17.1569 10 15.5C10 13.8431 11.3431 12.5 13 12.5H16.9142L18.2071 13.7929C18.5976 14.1834 18.5976 14.8166 18.2071 15.2071C17.8166 15.5976 17.1834 15.5976 16.7929 15.2071L13.7929 12.2071C13.4024 11.8166 13.4024 11.1834 13.7929 10.7929L16.7929 7.79289C17.1834 7.40237 17.8166 7.40237 18.2071 7.79289Z"
          fill="currentColor"
        />
      </svg>
    )
  }
)

RedoIcon.displayName = "RedoIcon" 