import createCache from "@emotion/cache";
import type { EmotionCache } from "@emotion/react";

const isBrowser = typeof document !== "undefined";
export const ssrCssRenderCaches: Record<string, EmotionCache> = {};

// On the clients side, Create a meta tag at the top of the <head> and set it as insertionPoint.
// This assures that MUI styles are loaded first.
// It allows developers to easily override MUI styles with other styling solutions, like CSS modules.
export default function createEmotionCache() {
  let insertionPoint: HTMLElement | undefined;

  if (isBrowser) {
    const emotionInsertionPoint = document.querySelector('meta[name="emotion-insertion-point"]') as HTMLElement;
    insertionPoint = emotionInsertionPoint ?? undefined;
  }

  return createCache({ key: "css", insertionPoint, prepend: true });
}
