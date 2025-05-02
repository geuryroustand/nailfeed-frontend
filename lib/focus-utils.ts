/**
 * Focuses an element without causing the page to scroll
 * @param element The element to focus
 */
export function focusWithoutScroll(element: HTMLElement | null) {
  if (!element) return

  // Save current scroll position
  const scrollX = window.scrollX
  const scrollY = window.scrollY

  // Focus the element
  element.focus({ preventScroll: true })

  // Restore scroll position (in case preventScroll doesn't work in some browsers)
  window.scrollTo(scrollX, scrollY)
}

/**
 * Scrolls to an element smoothly without changing focus
 * @param element The element to scroll to
 * @param options Scroll options
 */
export function scrollToElement(
  element: HTMLElement | null,
  options: { behavior?: ScrollBehavior; block?: ScrollLogicalPosition } = {},
) {
  if (!element) return

  const { behavior = "smooth", block = "nearest" } = options

  element.scrollIntoView({
    behavior,
    block,
  })
}
