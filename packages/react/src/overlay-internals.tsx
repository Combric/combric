"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
  type ReactPortal,
  type Ref,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

export type OverlaySide = "bottom" | "left" | "right" | "top";
export type OverlayAlign = "center" | "end" | "start";

interface ControllableOpenOptions {
  componentName: string;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  open?: boolean | undefined;
}

export function useControllableOpen({
  componentName,
  defaultOpen = false,
  onOpenChange,
  open,
}: ControllableOpenOptions): readonly [boolean, (open: boolean) => void] {
  const controlled = open !== undefined;
  const initialControlled = useRef(controlled);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  if (initialControlled.current !== controlled) {
    throw new Error(
      `${componentName} cannot switch between controlled and uncontrolled modes.`,
    );
  }

  const currentOpen = controlled ? open : uncontrolledOpen;
  const currentOpenRef = useRef(currentOpen);
  const onOpenChangeRef = useRef(onOpenChange);
  currentOpenRef.current = currentOpen;
  onOpenChangeRef.current = onOpenChange;

  const setOpen = useCallback((nextOpen: boolean): void => {
    if (!initialControlled.current) {
      setUncontrolledOpen(nextOpen);
    }
    if (nextOpen !== currentOpenRef.current) {
      onOpenChangeRef.current?.(nextOpen);
    }
  }, []);

  return [currentOpen, setOpen] as const;
}

export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): (value: T | null) => void {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref !== null && ref !== undefined) {
        (ref as MutableRefObject<T | null>).current = value;
      }
    }
  };
}

export function usePortalHost(
  container?: HTMLElement | null,
): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const portalHost = document.createElement("div");
    portalHost.dataset.combricPortal = "";
    (container ?? document.body).append(portalHost);
    setHost(portalHost);

    return () => {
      portalHost.remove();
    };
  }, [container]);

  return host;
}

export function renderPortal(
  children: ReactNode,
  host: HTMLElement | null,
): ReactPortal | null {
  return host === null ? null : createPortal(children, host);
}

const layerStack: string[] = [];

export function useLayer(active: boolean): string {
  const id = `combric-layer-${useId().replaceAll(":", "")}`;

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    layerStack.push(id);
    return () => {
      const index = layerStack.lastIndexOf(id);
      if (index >= 0) {
        layerStack.splice(index, 1);
      }
    };
  }, [active, id]);

  return id;
}

export function isTopLayer(id: string): boolean {
  return layerStack.at(-1) === id;
}

function canReceiveRestoredFocus(element: HTMLElement | null): boolean {
  if (element === null || !element.isConnected || element.inert) {
    return false;
  }
  if (element.getAttribute("aria-disabled") === "true") {
    return false;
  }
  return !("disabled" in element && Boolean(element.disabled));
}

export function useFocusRestoration<T extends HTMLElement>(
  open: boolean,
  triggerRef: RefObject<T | null>,
  restoreOnCloseRef?: RefObject<boolean>,
): void {
  const wasOpenRef = useRef(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open && !wasOpenRef.current && typeof document !== "undefined") {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    }

    if (!open && wasOpenRef.current) {
      const shouldRestore = restoreOnCloseRef?.current ?? true;
      if (shouldRestore) {
        const target = canReceiveRestoredFocus(triggerRef.current)
          ? triggerRef.current
          : previousFocusRef.current;
        queueMicrotask(() => {
          if (target !== null && canReceiveRestoredFocus(target)) {
            target.focus();
          }
        });
      }
      if (restoreOnCloseRef !== undefined) {
        (restoreOnCloseRef as MutableRefObject<boolean>).current = true;
      }
      previousFocusRef.current = null;
    }

    wasOpenRef.current = open;
  }, [open, restoreOnCloseRef, triggerRef]);
}

const focusableSelector = [
  "a[href]",
  "button:not(:disabled)",
  "input:not(:disabled):not([type='hidden'])",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter(
    (element) =>
      !element.hidden &&
      element.getAttribute("aria-hidden") !== "true" &&
      !element.inert,
  );
}

export function focusInitial(container: HTMLElement): void {
  const autofocus = container.querySelector<HTMLElement>("[autofocus]");
  const target = autofocus ?? focusableElements(container)[0] ?? container;
  target.focus();
}

interface FocusTrapOptions {
  active: boolean;
  contentRef: RefObject<HTMLElement | null>;
  layerId: string;
  onEscape: () => void;
  readyDependency?: unknown;
}

export function useFocusTrap({
  active,
  contentRef,
  layerId,
  onEscape,
  readyDependency,
}: FocusTrapOptions): void {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    const content = contentRef.current;
    if (!active || content === null || typeof document === "undefined") {
      return undefined;
    }

    focusInitial(content);

    function handleKeyDown(event: KeyboardEvent): void {
      if (!isTopLayer(layerId) || event.defaultPrevented) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onEscapeRef.current();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }

      const currentContent = contentRef.current;
      if (currentContent === null) {
        return;
      }
      const elements = focusableElements(currentContent);
      if (elements.length === 0) {
        event.preventDefault();
        currentContent.focus();
        return;
      }

      const first = elements[0];
      const last = elements.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === currentContent)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [active, contentRef, layerId, readyDependency]);
}

export function useModalIsolation(
  host: HTMLElement | null,
  active: boolean,
): void {
  useEffect(() => {
    if (!active || host === null || typeof document === "undefined") {
      return undefined;
    }

    const parent = host.parentElement;
    if (parent === null) {
      return undefined;
    }

    const siblings = Array.from(parent.children).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== host,
    );
    const previous = siblings.map((element) => ({
      ariaHidden: element.getAttribute("aria-hidden"),
      element,
      inert: element.inert,
    }));
    const previousOverflow = document.body.style.overflow;

    for (const sibling of siblings) {
      sibling.inert = true;
      sibling.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "hidden";

    return () => {
      for (const state of previous) {
        state.element.inert = state.inert;
        if (state.ariaHidden === null) {
          state.element.removeAttribute("aria-hidden");
        } else {
          state.element.setAttribute("aria-hidden", state.ariaHidden);
        }
      }
      document.body.style.overflow = previousOverflow;
    };
  }, [active, host]);
}

interface DismissableLayerOptions {
  active: boolean;
  contentRef: RefObject<HTMLElement | null>;
  layerId: string;
  onEscape: () => void;
  onOutside: () => void;
  triggerRef: RefObject<HTMLElement | null>;
}

export function useDismissableLayer({
  active,
  contentRef,
  layerId,
  onEscape,
  onOutside,
  triggerRef,
}: DismissableLayerOptions): void {
  useEffect(() => {
    if (!active || typeof document === "undefined") {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (
        event.key === "Escape" &&
        !event.defaultPrevented &&
        isTopLayer(layerId)
      ) {
        event.preventDefault();
        onEscape();
      }
    }

    function handlePointerDown(event: PointerEvent): void {
      if (!isTopLayer(layerId) || event.defaultPrevented) {
        return;
      }
      if (!(event.target instanceof Node)) {
        return;
      }
      if (
        contentRef.current?.contains(event.target) === true ||
        triggerRef.current?.contains(event.target) === true
      ) {
        return;
      }
      onOutside();
    }

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [active, contentRef, layerId, onEscape, onOutside, triggerRef]);
}

interface AnchoredPositionOptions {
  active: boolean;
  align: OverlayAlign;
  contentRef: RefObject<HTMLElement | null>;
  side: OverlaySide;
  triggerRef: RefObject<HTMLElement | null>;
}

interface AnchoredPositionResult {
  resolvedSide: OverlaySide;
  style: CSSProperties;
}

function tokenOffset(element: HTMLElement): number {
  const value = getComputedStyle(element)
    .getPropertyValue("--combric-space-2")
    .trim();
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function useAnchoredPosition({
  active,
  align,
  contentRef,
  side,
  triggerRef,
}: AnchoredPositionOptions): AnchoredPositionResult {
  const [position, setPosition] = useState<AnchoredPositionResult>({
    resolvedSide: side,
    style: { left: 0, position: "fixed", top: 0 },
  });

  useEffect(() => {
    if (!active || typeof window === "undefined") {
      return undefined;
    }

    function update(): void {
      const trigger = triggerRef.current;
      const content = contentRef.current;
      if (trigger === null || content === null) {
        return;
      }

      const anchor = trigger.getBoundingClientRect();
      const floating = content.getBoundingClientRect();
      const offset = tokenOffset(content);
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      let resolvedSide = side;

      if (
        side === "bottom" &&
        anchor.bottom + offset + floating.height > viewportHeight
      ) {
        resolvedSide = "top";
      } else if (side === "top" && anchor.top - offset - floating.height < 0) {
        resolvedSide = "bottom";
      } else if (
        side === "right" &&
        anchor.right + offset + floating.width > viewportWidth
      ) {
        resolvedSide = "left";
      } else if (side === "left" && anchor.left - offset - floating.width < 0) {
        resolvedSide = "right";
      }

      let top = anchor.bottom + offset;
      let left = anchor.left;

      if (resolvedSide === "top") {
        top = anchor.top - floating.height - offset;
      } else if (resolvedSide === "left") {
        left = anchor.left - floating.width - offset;
        top = anchor.top;
      } else if (resolvedSide === "right") {
        left = anchor.right + offset;
        top = anchor.top;
      }

      if (resolvedSide === "bottom" || resolvedSide === "top") {
        if (align === "center") {
          left = anchor.left + (anchor.width - floating.width) / 2;
        } else if (align === "end") {
          left = anchor.right - floating.width;
        }
      } else if (align === "center") {
        top = anchor.top + (anchor.height - floating.height) / 2;
      } else if (align === "end") {
        top = anchor.bottom - floating.height;
      }

      left = Math.min(
        Math.max(left, offset),
        Math.max(offset, viewportWidth - floating.width - offset),
      );
      top = Math.min(
        Math.max(top, offset),
        Math.max(offset, viewportHeight - floating.height - offset),
      );

      setPosition({
        resolvedSide,
        style: { left, position: "fixed", top },
      });
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, align, contentRef, side, triggerRef]);

  return position;
}
