import { useEffect, useRef } from "react";

/**
 * LuminaCursor
 * A custom mouse cursor with a green dot + red ring that follows the pointer.
 * - Dot is snappy (instant)
 * - Ring has a smooth lag (CSS transition)
 * - Ring expands over interactive elements (a, button, [role=button], input, etc.)
 * - Dot + ring pulse red on mousedown
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const INTERACTIVE = "a, button, input, textarea, select, [role='button'], [tabindex]";

    const onMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      // Dot snaps instantly via inline style (faster than CSS transition)
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;

      // Ring follows with CSS transition lag
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;

      // Expand ring when over an interactive element
      const target = e.target as Element;
      if (target.closest(INTERACTIVE)) {
        ring.classList.add("hovered");
      } else {
        ring.classList.remove("hovered");
      }
    };

    const onDown = () => {
      dot.classList.add("clicking");
      ring.classList.add("hovered");
    };

    const onUp = () => {
      dot.classList.remove("clicking");
      ring.classList.remove("hovered");
    };

    const onLeave = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const onEnter = () => {
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  return (
    <>
      {/* Green centre dot — snappy */}
      <span
        ref={dotRef}
        className="lumina-cursor-dot"
        aria-hidden="true"
      />
      {/* Red outer ring — smooth lag */}
      <span
        ref={ringRef}
        className="lumina-cursor-ring"
        aria-hidden="true"
      />
    </>
  );
}
