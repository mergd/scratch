import { useLayoutEffect, useState, type RefObject } from "react";

export function useShadowRoot(
  ref: RefObject<HTMLElement | null>,
): ShadowRoot | Document {
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | Document>(() =>
    typeof document !== "undefined" ? document : (null as unknown as Document),
  );

  useLayoutEffect(() => {
    if (ref.current) {
      setShadowRoot(ref.current.getRootNode() as ShadowRoot | Document);
    }
  }, [ref]);

  return shadowRoot;
}
