import * as React from "react"
import { IconProps } from "../../types"

export const UndoIcon = React.memo<IconProps>(
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
          d="M5.79289 7.79289C6.18342 7.40237 6.81658 7.40237 7.20711 7.79289C7.59763 8.18342 7.59763 8.81658 7.20711 9.20711L5.91421 10.5H11C13.7614 10.5 16 12.7386 16 15.5C16 18.2614 13.7614 20.5 11 20.5H9C8.44772 20.5 8 20.0523 8 19.5C8 18.9477 8.44772 18.5 9 18.5H11C12.6569 18.5 14 17.1569 14 15.5C14 13.8431 12.6569 12.5 11 12.5H5.91421L7.20711 13.7929C7.59763 14.1834 7.59763 14.8166 7.20711 15.2071C6.81658 15.5976 6.18342 15.5976 5.79289 15.2071L2.79289 12.2071C2.40237 11.8166 2.40237 11.1834 2.79289 10.7929L5.79289 7.79289Z"
          fill="currentColor"
        />
      </svg>
    )
  }
)

UndoIcon.displayName = "UndoIcon" 