// Where a modal puts the focus when it opens: Mantine focuses the first
// tabbable element otherwise, the close button, and draws its ring at once.
// Tab still reaches every control from here.
export function FocusStart() {
  return <div data-autofocus tabIndex={-1} style={{ outline: "none" }} />
}
