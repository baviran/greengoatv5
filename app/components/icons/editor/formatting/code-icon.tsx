import * as React from "react"
import { IconProps } from "../../types"

export const CodeIcon = React.memo<IconProps>(
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
          d="M16.2071 6.29289C16.5976 6.68342 16.5976 7.31658 16.2071 7.70711L12.9142 11L16.2071 14.2929C16.5976 14.6834 16.5976 15.3166 16.2071 15.7071C15.8166 16.0976 15.1834 16.0976 14.7929 15.7071L10.7929 11.7071C10.4024 11.3166 10.4024 10.6834 10.7929 10.2929L14.7929 6.29289C15.1834 5.90237 15.8166 5.90237 16.2071 6.29289Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.79289 6.29289C8.18342 5.90237 8.81658 5.90237 9.20711 6.29289C9.59763 6.68342 9.59763 7.31658 9.20711 7.70711L5.91421 11L9.20711 14.2929C9.59763 14.6834 9.59763 15.3166 9.20711 15.7071C8.81658 16.0976 8.18342 16.0976 7.79289 15.7071L3.79289 11.7071C3.40237 11.3166 3.40237 10.6834 3.79289 10.2929L7.79289 6.29289Z"
          fill="currentColor"
        />
      </svg>
    )
  }
)

CodeIcon.displayName = "CodeIcon" 