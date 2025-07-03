import * as React from "react"
import { IconProps } from "../../types"

export const ArrowLeftIcon = React.memo<IconProps>(
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
          d="M12.7071 5.29289C13.0976 5.68342 13.0976 6.31658 12.7071 6.70711L7.41421 12L12.7071 17.2929C13.0976 17.6834 13.0976 18.3166 12.7071 18.7071C12.3166 19.0976 11.6834 19.0976 11.2929 18.7071L5.29289 12.7071C4.90237 12.3166 4.90237 11.6834 5.29289 11.2929L11.2929 5.29289C11.6834 4.90237 12.3166 4.90237 12.7071 5.29289Z"
          fill="currentColor"
        />
      </svg>
    )
  }
)

ArrowLeftIcon.displayName = "ArrowLeftIcon" 