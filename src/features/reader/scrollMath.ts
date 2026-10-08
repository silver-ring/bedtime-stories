const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Share of the scrollable length that has been scrolled. Content that fits on
 * screen has nothing to scroll, so it counts as fully read.
 */
export function scrollFraction(
  offsetY: number,
  contentHeight: number,
  viewportHeight: number,
): number {
  const scrollable = contentHeight - viewportHeight;
  if (!(scrollable > 0)) {
    return 1;
  }
  return clamp01(offsetY / scrollable);
}

/** Inverse of scrollFraction: the offset that restores a saved position. */
export function offsetForFraction(
  fraction: number,
  contentHeight: number,
  viewportHeight: number,
): number {
  const scrollable = Math.max(0, contentHeight - viewportHeight);
  return clamp01(fraction) * scrollable;
}
