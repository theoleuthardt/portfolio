import { useEffect, useState } from "react";
import { tabTitle, type TabTitleState } from "../terminal/tabTitle";
import { useDocumentHidden } from "./useDocumentHidden";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const BLINK_MS = 530;

/**
 * Keeps `document.title` in sync with the terminal: follows the tab's
 * visibility and blinks the prompt cursor (not with reduced motion).
 */
export function useTabTitle(
  state: Omit<TabTitleState, "hidden" | "cursorOn">,
): void {
  const reducedMotion = usePrefersReducedMotion();
  const hidden = useDocumentHidden();
  const [cursorOn, setCursorOn] = useState(true);
  const blinking =
    state.phase === "ready" &&
    state.openProjectId === undefined &&
    !hidden &&
    !reducedMotion;

  useEffect(() => {
    if (!blinking) {
      return;
    }
    const timer = window.setInterval(() => setCursorOn((on) => !on), BLINK_MS);
    return () => window.clearInterval(timer);
  }, [blinking]);

  useEffect(() => {
    document.title = tabTitle({
      ...state,
      hidden,
      cursorOn: cursorOn || !blinking,
    });
  });
}
