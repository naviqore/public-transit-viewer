/**
 * Scrolls an element into view within its nearest `.panel-section` scrollable
 * ancestor, accounting for the sticky `.panel-header` so the card top is
 * fully visible below the header.
 */
export function scrollCardIntoView(
  elementId: string,
  extraPaddingPx = 8
): void {
  const el = document.getElementById(elementId);
  if (!el) return;

  const scrollContainer = el.closest('.panel-section') as HTMLElement | null;
  if (!scrollContainer) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  const stickyHeader = scrollContainer.querySelector(
    '.panel-header'
  ) as HTMLElement | null;
  const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 0;

  const elementTop =
    el.getBoundingClientRect().top -
    scrollContainer.getBoundingClientRect().top +
    scrollContainer.scrollTop;

  scrollContainer.scrollTo({
    top: elementTop - headerHeight - extraPaddingPx,
    behavior: 'smooth',
  });
}
