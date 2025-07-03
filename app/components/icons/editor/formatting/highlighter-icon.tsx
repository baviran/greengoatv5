import * as React from "react"
import { IconProps } from "../../types"

export const HighlighterIcon = React.memo<IconProps>(
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
          d="M15.7071 2.29289C16.0976 2.68342 16.0976 3.31658 15.7071 3.70711L3.70711 15.7071C3.31658 16.0976 2.68342 16.0976 2.29289 15.7071C1.90237 15.3166 1.90237 14.6834 2.29289 14.2929L14.2929 2.29289C14.6834 1.90237 15.3166 1.90237 15.7071 2.29289Z"
          fill="currentColor"
        />
        <path
          d="M12 5.41421L18.5858 12L15.7071 14.8787L9.12132 8.29289L12 5.41421Z"
          fill="currentColor"
        />
        <path
          d="M8.70711 18.2929L5.70711 21.2929C5.31658 21.6834 4.68342 21.6834 4.29289 21.2929C3.90237 20.9024 3.90237 20.2692 4.29289 19.8787L7.29289 16.8787L8.70711 18.2929Z"
          fill="currentColor"
        />
      </svg>
    )
  }
)

HighlighterIcon.displayName = "HighlighterIcon" 