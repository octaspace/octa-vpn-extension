// Stroke icons, decorative: the control around each carries the name.

type Props = { size?: number }

function Icon({ size = 18, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      {children}
    </svg>
  )
}

export const SlidersIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Icon>
)
export const BackIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
)
export const ChevronIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M9 5l7 7-7 7" />
  </Icon>
)
export const DownIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
)
export const CheckIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M5 12l5 5 9-10" />
  </Icon>
)
export const BoltIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
  </Icon>
)
export const CloseIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
)
export const ShieldIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
  </Icon>
)
export const RingIcon = (p: Props) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
  </Icon>
)
export const AlertIcon = (p: Props) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v6M12 17h.01" />
  </Icon>
)
