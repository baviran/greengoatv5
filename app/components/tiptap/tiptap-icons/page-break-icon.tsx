import * as React from "react"

export const PageBreakIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Top page */}
    <rect x="4" y="2" width="16" height="8" rx="1" />
    {/* Bottom page */}
    <rect x="4" y="14" width="16" height="8" rx="1" />
    {/* Dashed line separator */}
    <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="3,3" />
    {/* Arrow indicators */}
    <path d="M7 12L9 10M7 12L9 14" />
    <path d="M17 12L15 10M17 12L15 14" />
  </svg>
))

PageBreakIcon.displayName = "PageBreakIcon" 