import { createElement, type ReactElement, type SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number | string;
  title?: string;
};

export type CombricIcon = (props: IconProps) => ReactElement;

type IconNode = readonly [
  tag: string,
  attributes: Readonly<Record<string, string>>,
  children?: readonly IconNode[],
];

interface IconDefaults {
  viewBox?: string;
  fill?: string;
  strokeWidth?: string;
}

function renderNode(node: IconNode, key: string): ReactElement {
  const [tag, attributes, children] = node;
  const renderedChildren = children?.map((child, index) =>
    renderNode(child, `${key}-${index}`),
  );
  return createElement(
    tag,
    { ...attributes, key },
    ...(renderedChildren ?? []),
  );
}

export function createIcon(
  name: string,
  nodes: readonly IconNode[],
  defaults: IconDefaults = {},
): CombricIcon {
  function Icon({
    "aria-hidden": ariaHidden,
    height,
    role,
    size = "1em",
    title,
    width,
    ...props
  }: IconProps): ReactElement {
    const labelled = Boolean(
      title || props["aria-label"] || props["aria-labelledby"],
    );
    const resolvedAriaHidden = ariaHidden ?? (labelled ? undefined : true);
    const resolvedRole = role ?? (labelled ? "img" : undefined);

    return createElement(
      "svg",
      {
        ...props,
        "aria-hidden": resolvedAriaHidden,
        "data-combric-icon": name,
        focusable: "false",
        fill: props.fill ?? defaults.fill ?? "none",
        height: height ?? size,
        role: resolvedRole,
        strokeWidth: props.strokeWidth ?? defaults.strokeWidth,
        viewBox: props.viewBox ?? defaults.viewBox ?? "0 0 24 24",
        width: width ?? size,
        xmlns: "http://www.w3.org/2000/svg",
      },
      ...(title ? [createElement("title", { key: "title" }, title)] : []),
      ...nodes.map((node, index) => renderNode(node, String(index))),
    );
  }

  Icon.displayName = `${name}Icon`;
  return Icon;
}
