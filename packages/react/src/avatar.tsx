"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactElement,
  type Ref,
} from "react";

import { classNames } from "./class-names.js";

type AvatarImageStatus = "loading" | "loaded" | "error";
export type AvatarSize = "sm" | "md" | "lg";

interface AvatarContextValue {
  setStatus: (status: AvatarImageStatus) => void;
  status: AvatarImageStatus;
}

const AvatarContext = createContext<AvatarContextValue | null>(null);

function useAvatarContext(): AvatarContextValue {
  const context = useContext(AvatarContext);
  if (context === null) {
    throw new Error("AvatarImage and AvatarFallback must be nested in Avatar.");
  }
  return context;
}

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  size?: AvatarSize;
}

export function Avatar({
  className,
  ref,
  size = "md",
  ...props
}: AvatarProps): ReactElement {
  if (size !== "sm" && size !== "md" && size !== "lg") {
    throw new RangeError("Avatar size must be sm, md, or lg.");
  }
  const [status, setStatus] = useState<AvatarImageStatus>("loading");

  return (
    <AvatarContext.Provider value={{ setStatus, status }}>
      <div
        {...props}
        ref={ref}
        className={classNames("combric-avatar", className)}
        data-size={size}
        data-state={status}
      />
    </AvatarContext.Provider>
  );
}

export interface AvatarImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "alt"
> {
  alt: string;
  ref?: Ref<HTMLImageElement>;
}

export function AvatarImage({
  alt,
  className,
  onError,
  onLoad,
  ref,
  src,
  ...props
}: AvatarImageProps): ReactElement {
  const { setStatus, status } = useAvatarContext();

  useEffect(() => {
    setStatus("loading");
  }, [setStatus, src]);

  return (
    <img
      {...props}
      ref={ref}
      alt={alt}
      src={src}
      className={classNames("combric-avatar__image", className)}
      hidden={status === "error"}
      onError={(event) => {
        onError?.(event);
        setStatus("error");
      }}
      onLoad={(event) => {
        onLoad?.(event);
        setStatus("loaded");
      }}
    />
  );
}

export interface AvatarFallbackProps extends HTMLAttributes<HTMLSpanElement> {
  ref?: Ref<HTMLSpanElement>;
}

export function AvatarFallback({
  className,
  ref,
  ...props
}: AvatarFallbackProps): ReactElement {
  const { status } = useAvatarContext();

  return (
    <span
      {...props}
      ref={ref}
      className={classNames("combric-avatar__fallback", className)}
      hidden={status === "loaded"}
    />
  );
}
