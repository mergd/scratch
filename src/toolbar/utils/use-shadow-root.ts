import { useLayoutEffect, useState, type RefObject } from "react";

function resolveRoot(
  ref: RefObject<HTMLElement | null>,
): ShadowRoot | Document {
  if (typeof document === "undefined") {
    return null as unknown as Document;
  }
  const root = ref.current?.getRootNode();
  if (root instanceof ShadowRoot) {
    return root;
  }
  return document;
}

/**
 * Resolve the ShadowRoot that owns `ref`, falling back to `document`.
 * Re-resolves after layout so the first committed ref is not missed.
 */
export function useShadowRoot(
  ref: RefObject<HTMLElement | null>,
): ShadowRoot | Document {
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | Document>(() =>
    resolveRoot(ref),
  );

  useLayoutEffect(() => {
    setShadowRoot(resolveRoot(ref));
  }, [ref]);

  return shadowRoot;
}
