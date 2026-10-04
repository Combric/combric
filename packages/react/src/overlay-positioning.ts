"use client";

import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
  useFloating,
  type Placement,
} from "@floating-ui/react";
import {
  useCallback,
  useMemo,
  type CSSProperties,
  type RefCallback,
} from "react";

export type OverlaySide = "bottom" | "left" | "right" | "top";
export type OverlayAlign = "center" | "end" | "start";
export type OverlayStrategy = "absolute" | "fixed";
export type OverlayPlacement =
  OverlaySide | `${OverlaySide}-${Exclude<OverlayAlign, "center">}`;

/** A non-DOM anchor, for example a context-menu pointer location. */
export interface OverlayVirtualAnchor {
  contextElement?: Element | null;
  getBoundingClientRect(): DOMRect;
  getClientRects?(): DOMRectList | readonly DOMRect[];
}

export type OverlayAnchor = Element | OverlayVirtualAnchor;

export interface OverlayPositioningOptions {
  align?: OverlayAlign;
  boundary?: Element;
  collisionPadding?: number;
  offset?: number;
  open: boolean;
  side?: OverlaySide;
  strategy?: OverlayStrategy;
}

export interface OverlayPositioning {
  align: OverlayAlign;
  floatingStyles: CSSProperties;
  isPositioned: boolean;
  placement: OverlayPlacement;
  refs: {
    setFloating: RefCallback<HTMLElement>;
    setPositionReference: (anchor: OverlayAnchor | null) => void;
    setReference: RefCallback<Element>;
  };
  side: OverlaySide;
  update: () => void;
}

/** Creates a logical placement: start and end adapt to the document direction. */
export function createOverlayPlacement(
  side: OverlaySide,
  align: OverlayAlign,
): OverlayPlacement {
  return align === "center" ? side : `${side}-${align}`;
}

function resolvePlacement(placement: Placement): {
  align: OverlayAlign;
  side: OverlaySide;
} {
  const [rawSide, rawAlign] = placement.split("-");
  return {
    align: rawAlign === "start" || rawAlign === "end" ? rawAlign : "center",
    side: rawSide as OverlaySide,
  };
}

/**
 * Positions a floating element with logical placement, collision handling,
 * automatic updates, and optional virtual anchors. It intentionally owns no
 * visual styling or interaction policy.
 */
export function useOverlayPositioning({
  align = "start",
  boundary,
  collisionPadding = 0,
  offset = 0,
  open,
  side = "bottom",
  strategy = "fixed",
}: OverlayPositioningOptions): OverlayPositioning {
  const middleware = useMemo(() => {
    const collision =
      boundary === undefined
        ? { padding: collisionPadding }
        : { boundary, padding: collisionPadding };

    return [floatingOffset(offset), flip(collision), shift(collision)];
  }, [boundary, collisionPadding, offset]);
  const floating = useFloating({
    middleware,
    open,
    placement: createOverlayPlacement(side, align),
    strategy,
    transform: false,
    whileElementsMounted: autoUpdate,
  });
  const setReference = useCallback<RefCallback<Element>>(
    (element) => {
      floating.refs.setReference(element);
    },
    [floating.refs],
  );
  const setFloating = useCallback<RefCallback<HTMLElement>>(
    (element) => {
      floating.refs.setFloating(element);
    },
    [floating.refs],
  );
  const setPositionReference = useCallback(
    (anchor: OverlayAnchor | null) => {
      floating.refs.setPositionReference(
        anchor as Parameters<typeof floating.refs.setPositionReference>[0],
      );
    },
    [floating.refs],
  );
  const refs = useMemo(
    () => ({ setFloating, setPositionReference, setReference }),
    [setFloating, setPositionReference, setReference],
  );
  const resolved = resolvePlacement(floating.placement);

  return {
    align: resolved.align,
    floatingStyles: floating.floatingStyles,
    isPositioned: floating.isPositioned,
    placement: floating.placement as OverlayPlacement,
    refs,
    side: resolved.side,
    update: floating.update,
  };
}
