export function takeFirst<T extends Record<string, unknown>>(items: T[]) {
  return items?.[0];
}
