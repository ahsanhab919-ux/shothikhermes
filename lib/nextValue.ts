export type NextResult<T> = { exists: true; value: T } | { exists: false; value: undefined };

export type LinkedNode<T> = { value: T; next?: LinkedNode<T> | null };

export function nextInArray<T>(
  arr: readonly T[] | null | undefined,
  index: number,
): NextResult<T> {
  if (!arr || arr.length === 0) return { exists: false, value: undefined };
  if (!Number.isFinite(index)) return { exists: false, value: undefined };
  const i = Math.trunc(index);
  const nextIndex = i + 1;
  if (nextIndex < 0 || nextIndex >= arr.length) return { exists: false, value: undefined };
  return { exists: true, value: arr[nextIndex] as T };
}

export function nextInIterator<T>(it: Iterator<T> | null | undefined): NextResult<T> {
  if (!it) return { exists: false, value: undefined };
  const r = it.next();
  if (r.done) return { exists: false, value: undefined };
  return { exists: true, value: r.value };
}

export function nextInLinkedList<T>(node: LinkedNode<T> | null | undefined): NextResult<T> {
  const next = node?.next ?? null;
  if (!next) return { exists: false, value: undefined };
  return { exists: true, value: next.value };
}

export function nextValue<T>(
  source: readonly T[] | Iterator<T> | LinkedNode<T> | null | undefined,
  position?: number,
): NextResult<T> {
  if (!source) return { exists: false, value: undefined };
  if (typeof (source as any).next === "function") return nextInIterator(source as Iterator<T>);
  if (typeof (source as any).value !== "undefined" && "next" in (source as any)) {
    return nextInLinkedList(source as LinkedNode<T>);
  }
  return nextInArray(source as readonly T[], position ?? -1);
}
