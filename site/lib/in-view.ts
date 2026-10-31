export function resolveInView(entry: IntersectionObserverEntry) {
  return entry.isIntersecting || entry.boundingClientRect.top < 0;
}
