export type CatalogueGroup =
  | "Actions"
  | "Forms"
  | "Navigation"
  | "Data & Display"
  | "Disclosure"
  | "Overlays"
  | "Feedback";

export interface CatalogueEntry {
  readonly slug: string;
  readonly title: string;
  readonly group: CatalogueGroup;
  readonly route: string;
  readonly publicExports: readonly string[];
  readonly aliases?: Readonly<Record<string, string>>;
  readonly package: "@combric/react";
  readonly status: "unreleased";
  readonly summary: string;
  readonly api: readonly string[];
  readonly accessibility: string;
  readonly keyboard?: string;
  readonly source: string;
  readonly playground: boolean;
}

type EntryInput = Omit<CatalogueEntry, "route" | "package" | "status">;

function entry(input: EntryInput): CatalogueEntry {
  return Object.freeze({
    ...input,
    route: `/components/${input.group
      .toLowerCase()
      .replaceAll(" & ", "-")
      .replaceAll(" ", "-")}/${input.slug}/`,
    package: "@combric/react",
    status: "unreleased",
  });
}

export const catalogue = Object.freeze([
  entry({
    slug: "button",
    title: "Button",
    group: "Actions",
    publicExports: ["Button"],
    summary: "Native button with bounded visual variants and sizes.",
    api: [
      "variant: primary | secondary | ghost",
      "size: sm | md | lg",
      "type defaults to button",
    ],
    accessibility:
      "Retains native button semantics, disabled behavior, and consumer-provided accessible naming.",
    keyboard: "Native Enter and Space activation.",
    source: "packages/react/src/button.tsx",
    playground: true,
  }),
  entry({
    slug: "toggle",
    title: "Toggle",
    group: "Actions",
    publicExports: ["Toggle"],
    summary: "Pressable tool-state button using aria-pressed.",
    api: ["pressed/defaultPressed", "onPressedChange", "native button props"],
    accessibility:
      "Uses a native button and exposes pressed state through aria-pressed.",
    keyboard: "Native Enter and Space activation.",
    source: "packages/react/src/toggle.tsx",
    playground: false,
  }),
  entry({
    slug: "toggle-group",
    title: "Toggle Group",
    group: "Actions",
    publicExports: ["ToggleGroup", "ToggleGroupItem"],
    summary: "Single or multiple pressable tool-state grouping.",
    api: [
      "type: single | multiple",
      "value/defaultValue",
      "orientation: horizontal | vertical",
    ],
    accessibility:
      "Groups toggle buttons without replacing native radio semantics when a form value is required.",
    keyboard:
      "Arrow keys move focus by orientation; Home and End move to boundaries without selecting.",
    source: "packages/react/src/toggle.tsx",
    playground: false,
  }),
  entry({
    slug: "label",
    title: "Label",
    group: "Forms",
    publicExports: ["Label"],
    summary: "Styled native label for explicit or wrapping association.",
    api: ["All native label props", "htmlFor"],
    accessibility:
      "Preserves native label association; consumers must supply visible, meaningful text.",
    source: "packages/react/src/form-controls.tsx",
    playground: false,
  }),
  entry({
    slug: "input",
    title: "Input",
    group: "Forms",
    publicExports: ["Input"],
    summary: "Styled native input retaining browser form behavior.",
    api: ["All native input props", "aria-invalid styling"],
    accessibility:
      "Requires a programmatic label; Combric styles invalid state but does not validate values.",
    source: "packages/react/src/form-controls.tsx",
    playground: true,
  }),
  entry({
    slug: "textarea",
    title: "Textarea",
    group: "Forms",
    publicExports: ["Textarea"],
    summary: "Native resizable multiline text control.",
    api: ["All native textarea props", "aria-invalid styling"],
    accessibility:
      "Requires a programmatic label and retains normal browser resizing and form behavior.",
    source: "packages/react/src/form-controls.tsx",
    playground: false,
  }),
  entry({
    slug: "checkbox",
    title: "Checkbox",
    group: "Forms",
    publicExports: ["Checkbox"],
    summary: "Native checkbox with Combric styling.",
    api: ["Native checkbox props", "checked/defaultChecked"],
    accessibility:
      "Preserves native checkbox semantics and form participation; no indeterminate abstraction is added.",
    keyboard: "Native Space toggling.",
    source: "packages/react/src/form-controls.tsx",
    playground: false,
  }),
  entry({
    slug: "radio-group",
    title: "Radio Group",
    group: "Forms",
    publicExports: ["Radio", "RadioGroup"],
    summary: "Native radio controls coordinated by a fieldset-backed group.",
    api: ["name", "value/defaultValue", "onValueChange", "disabled/required"],
    accessibility:
      "Uses native radio inputs and fieldset disabled propagation; provide a group label.",
    keyboard: "Native browser radio-group arrow and Space behavior.",
    source: "packages/react/src/form-controls.tsx",
    playground: false,
  }),
  entry({
    slug: "switch",
    title: "Switch",
    group: "Forms",
    publicExports: ["Switch"],
    summary: "Form-associated native checkbox presented as an on/off switch.",
    api: ["Native checkbox props", "checked/defaultChecked", "role is switch"],
    accessibility:
      "Requires a label and retains native form participation; use Checkbox for ordinary form choices.",
    keyboard: "Native Space toggling.",
    source: "packages/react/src/form-controls.tsx",
    playground: true,
  }),
  entry({
    slug: "select",
    title: "Select",
    group: "Forms",
    publicExports: ["Select"],
    summary: "Native select control without a custom popup abstraction.",
    api: ["All native select props", "aria-invalid styling"],
    accessibility:
      "Preserves native selection, keyboard, validation, and form semantics.",
    keyboard: "Platform-native select behavior.",
    source: "packages/react/src/form-controls.tsx",
    playground: false,
  }),
  entry({
    slug: "slider",
    title: "Slider",
    group: "Forms",
    publicExports: ["Slider"],
    summary: "Native horizontal range input.",
    api: ["min/max/step", "value/defaultValue", "native range props"],
    accessibility:
      "Requires an accessible name and preserves native form, validation, and range semantics.",
    keyboard: "Platform-native range keyboard behavior.",
    source: "packages/react/src/form-controls.tsx",
    playground: false,
  }),
  entry({
    slug: "field",
    title: "Field",
    group: "Forms",
    publicExports: ["Field", "FieldDescription", "FieldMessage"],
    summary:
      "Composes stable label, description, message, and control relationships.",
    api: ["invalid", "FieldDescription", "FieldMessage"],
    accessibility:
      "Composes mounted aria-describedby relationships without dangling IDs; validation remains consumer-owned.",
    source: "packages/react/src/field.tsx",
    playground: false,
  }),
  entry({
    slug: "fieldset",
    title: "Fieldset",
    group: "Forms",
    publicExports: ["Fieldset", "FieldLegend"],
    summary: "Styled native fieldset and legend composition.",
    api: ["Native fieldset and legend props", "disabled propagation"],
    accessibility: "Preserves native grouping, naming, and disabled semantics.",
    source: "packages/react/src/field.tsx",
    playground: false,
  }),
  entry({
    slug: "input-group",
    title: "Input Group",
    group: "Forms",
    publicExports: ["InputGroup"],
    summary:
      "Visual composition boundary for controls, adornments, and actions.",
    api: ["Native div props", "children"],
    accessibility:
      "Does not replace the control label; decorative adornments should be hidden from assistive technology.",
    source: "packages/react/src/field.tsx",
    playground: false,
  }),
  entry({
    slug: "breadcrumb",
    title: "Breadcrumb",
    group: "Navigation",
    publicExports: [
      "Breadcrumb",
      "BreadcrumbList",
      "BreadcrumbItem",
      "BreadcrumbLink",
      "BreadcrumbSeparator",
      "BreadcrumbPage",
    ],
    summary:
      "Labelled breadcrumb navigation with native links and ordered structure.",
    api: ["Native nav/list/link props", "BreadcrumbPage supplies aria-current"],
    accessibility:
      "Uses a labelled nav, ordered list, presentational separators, and aria-current for the current page.",
    source: "packages/react/src/breadcrumb.tsx",
    playground: false,
  }),
  entry({
    slug: "pagination",
    title: "Pagination",
    group: "Navigation",
    publicExports: [
      "Pagination",
      "PaginationList",
      "PaginationItem",
      "PaginationLink",
      "PaginationPrevious",
      "PaginationNext",
    ],
    summary: "Native link-based pagination structure without data ownership.",
    api: ["current", "disabled", "native anchor props"],
    accessibility:
      "Current links use aria-current; disabled links lose href and leave the tab order.",
    source: "packages/react/src/pagination.tsx",
    playground: false,
  }),
  entry({
    slug: "tabs",
    title: "Tabs",
    group: "Navigation",
    publicExports: ["Tabs", "TabsList", "TabsTrigger", "TabsContent"],
    summary: "Single-selection tabs with automatic horizontal activation.",
    api: ["value/defaultValue", "onValueChange", "disabled triggers"],
    accessibility:
      "Stable IDs connect tab, tablist, and tabpanel roles and state.",
    keyboard:
      "Left/Right wrap through enabled tabs; Home/End select boundaries.",
    source: "packages/react/src/tabs.tsx",
    playground: true,
  }),
  entry({
    slug: "avatar",
    title: "Avatar",
    group: "Data & Display",
    publicExports: ["Avatar", "AvatarImage", "AvatarFallback"],
    summary:
      "Image and deterministic fallback composition with square Metriq geometry.",
    api: ["size: sm | md | lg", "AvatarImage requires alt", "AvatarFallback"],
    accessibility:
      "Preserves native image alternative text; fallback changes do not invent presence semantics.",
    source: "packages/react/src/avatar.tsx",
    playground: false,
  }),
  entry({
    slug: "badge",
    title: "Badge",
    group: "Data & Display",
    publicExports: ["Badge"],
    summary:
      "Non-interactive compact label with neutral or accent presentation.",
    api: ["variant: neutral | accent", "native span props"],
    accessibility:
      "Renders a non-interactive span; status announcements remain consumer-owned.",
    source: "packages/react/src/display.tsx",
    playground: true,
  }),
  entry({
    slug: "card",
    title: "Card",
    group: "Data & Display",
    publicExports: [
      "Card",
      "CardHeader",
      "CardTitle",
      "CardDescription",
      "CardContent",
      "CardFooter",
    ],
    summary: "Compositional content surface with semantic sections.",
    api: [
      "Native props for each rendered element",
      "compositional subcomponents",
    ],
    accessibility:
      "Semantic structure is preserved; consumers remain responsible for the surrounding document outline.",
    source: "packages/react/src/card.tsx",
    playground: false,
  }),
  entry({
    slug: "separator",
    title: "Separator",
    group: "Data & Display",
    publicExports: ["Separator"],
    summary: "Horizontal native separator with an optional decorative mode.",
    api: ["decorative", "native hr props"],
    accessibility:
      "Semantic by default; decorative mode removes separator semantics and hides it from assistive technology.",
    source: "packages/react/src/display.tsx",
    playground: false,
  }),
  entry({
    slug: "table",
    title: "Table",
    group: "Data & Display",
    publicExports: [
      "TableContainer",
      "Table",
      "TableHeader",
      "TableBody",
      "TableFooter",
      "TableRow",
      "TableHead",
      "TableCell",
      "TableCaption",
    ],
    summary:
      "Native table family within a focusable horizontal overflow boundary.",
    api: ["Native table element props", "TableHead defaults scope to col"],
    accessibility:
      "Preserves table semantics; label the focusable TableContainer so users understand its scrollable content.",
    source: "packages/react/src/data-display.tsx",
    playground: false,
  }),
  entry({
    slug: "description-list",
    title: "Description List",
    group: "Data & Display",
    publicExports: ["DescriptionList", "DescriptionTerm", "DescriptionDetails"],
    summary: "Direct native dl, dt, and dd wrappers.",
    api: ["Native dl/dt/dd props"],
    accessibility:
      "Preserves native description-list semantics and source order.",
    source: "packages/react/src/data-display.tsx",
    playground: false,
  }),
  entry({
    slug: "accordion",
    title: "Accordion",
    group: "Disclosure",
    publicExports: [
      "Accordion",
      "AccordionItem",
      "AccordionTrigger",
      "AccordionContent",
    ],
    summary:
      "Single-open disclosure family with controlled and uncontrolled state.",
    api: ["value/defaultValue", "onValueChange", "disabled items"],
    accessibility:
      "Native buttons and stable IDs connect expanded state, controls, and labelled regions.",
    keyboard: "Native button Enter and Space behavior.",
    source: "packages/react/src/accordion.tsx",
    playground: false,
  }),
  entry({
    slug: "collapsible",
    title: "Collapsible",
    group: "Disclosure",
    publicExports: ["Collapsible", "CollapsibleTrigger", "CollapsibleContent"],
    summary: "Single disclosure with controlled or uncontrolled open state.",
    api: ["open/defaultOpen", "onOpenChange", "disabled"],
    accessibility:
      "Stable aria-expanded and aria-controls relationships connect the native trigger to its region.",
    keyboard: "Native button Enter and Space behavior.",
    source: "packages/react/src/collapsible.tsx",
    playground: false,
  }),
  entry({
    slug: "dialog",
    title: "Dialog",
    group: "Overlays",
    publicExports: [
      "Dialog",
      "DialogTrigger",
      "DialogContent",
      "DialogTitle",
      "DialogDescription",
      "DialogClose",
    ],
    summary:
      "Modal dialog with portal, background isolation, focus management, and dismissal.",
    api: ["open/defaultOpen", "onOpenChange", "container portal target"],
    accessibility:
      "Moves focus inside, cycles Tab, isolates background siblings, restores focus, and requires an accessible name.",
    keyboard:
      "Tab/Shift+Tab cycle; Escape closes the top active layer and restores trigger focus.",
    source: "packages/react/src/dialog.tsx",
    playground: true,
  }),
  entry({
    slug: "drawer",
    title: "Drawer / Sheet",
    group: "Overlays",
    publicExports: [
      "Drawer",
      "DrawerTrigger",
      "DrawerContent",
      "DrawerTitle",
      "DrawerDescription",
      "DrawerClose",
      "Sheet",
      "SheetTrigger",
      "SheetContent",
      "SheetTitle",
      "SheetDescription",
      "SheetClose",
    ],
    aliases: {
      Sheet: "Drawer",
      SheetTrigger: "DrawerTrigger",
      SheetContent: "DrawerContent",
      SheetTitle: "DrawerTitle",
      SheetDescription: "DrawerDescription",
      SheetClose: "DrawerClose",
    },
    summary: "Left or right modal drawer; Sheet names are exact aliases.",
    api: [
      "side: left | right",
      "Dialog-compatible open state and portal contract",
    ],
    accessibility:
      "Reuses Dialog modal isolation, focus trap, dismissal, naming, and restoration behavior.",
    keyboard: "Tab/Shift+Tab cycle; Escape closes and restores trigger focus.",
    source: "packages/react/src/drawer.tsx",
    playground: false,
  }),
  entry({
    slug: "dropdown-menu",
    title: "Dropdown Menu",
    group: "Overlays",
    publicExports: [
      "DropdownMenu",
      "DropdownMenuTrigger",
      "DropdownMenuContent",
      "DropdownMenuItem",
      "DropdownMenuSeparator",
    ],
    summary: "Portaled ARIA menu with bounded anchored positioning.",
    api: [
      "side: top | right | bottom | left",
      "align: start | center | end",
      "onSelect",
    ],
    accessibility:
      "Implements menu/menuitem roles, skips disabled items, and restores focus after keyboard dismissal.",
    keyboard:
      "Arrow keys wrap; Home/End move; Enter/Space select; Escape restores focus; Tab closes.",
    source: "packages/react/src/dropdown-menu.tsx",
    playground: false,
  }),
  entry({
    slug: "popover",
    title: "Popover",
    group: "Overlays",
    publicExports: ["Popover", "PopoverTrigger", "PopoverContent"],
    summary: "Non-modal portaled anchored content.",
    api: ["open/defaultOpen", "side", "align"],
    accessibility:
      "Does not trap focus or isolate background content; consumers supply appropriate content semantics.",
    keyboard:
      "Escape closes and restores trigger focus; outside pointer interaction dismisses without stealing focus.",
    source: "packages/react/src/popover.tsx",
    playground: false,
  }),
  entry({
    slug: "tooltip",
    title: "Tooltip",
    group: "Overlays",
    publicExports: ["Tooltip", "TooltipTrigger", "TooltipContent"],
    summary: "Immediate non-interactive description on hover or focus.",
    api: ["side", "align", "open/defaultOpen"],
    accessibility:
      "Uses role tooltip and aria-describedby, never moves focus, and requires non-interactive content.",
    keyboard: "Focus opens; blur or Escape closes.",
    source: "packages/react/src/tooltip.tsx",
    playground: false,
  }),
  entry({
    slug: "alert",
    title: "Alert",
    group: "Feedback",
    publicExports: ["Alert", "AlertTitle", "AlertDescription"],
    summary: "Static feedback section with explicit live-region opt-in.",
    api: ["tone: neutral | error", "live: polite | assertive"],
    accessibility:
      "Static by default; live semantics are added only when explicitly requested.",
    source: "packages/react/src/feedback.tsx",
    playground: true,
  }),
  entry({
    slug: "toast",
    title: "Toast",
    group: "Feedback",
    publicExports: [
      "ToastViewport",
      "Toast",
      "ToastTitle",
      "ToastDescription",
      "ToastClose",
    ],
    summary: "Compositional portaled notification with optional timeout.",
    api: [
      "open/defaultOpen",
      "duration (0 disables)",
      "priority: polite | assertive",
    ],
    accessibility:
      "Uses status or alert semantics by priority, provides an accessible close action, and never moves focus.",
    keyboard:
      "Close is a native button; notification itself does not capture focus.",
    source: "packages/react/src/toast.tsx",
    playground: false,
  }),
  entry({
    slug: "progress",
    title: "Progress",
    group: "Feedback",
    publicExports: ["Progress"],
    summary: "Native determinate or indeterminate progress element.",
    api: ["value", "max", "native progress props"],
    accessibility:
      "Requires a useful accessible name; omit value for indeterminate activity.",
    source: "packages/react/src/feedback.tsx",
    playground: true,
  }),
  entry({
    slug: "spinner",
    title: "Spinner",
    group: "Feedback",
    publicExports: ["Spinner"],
    summary: "Compact indeterminate busy indicator.",
    api: ["aria-label opts into status semantics", "native span props"],
    accessibility:
      "Decorative by default; a consumer label gives it status semantics without injected text.",
    source: "packages/react/src/feedback.tsx",
    playground: false,
  }),
  entry({
    slug: "skeleton",
    title: "Skeleton",
    group: "Feedback",
    publicExports: ["Skeleton"],
    summary: "Visual placeholder without progress semantics.",
    api: ["native div props"],
    accessibility:
      "Hidden from assistive technology by default; animation stops under reduced motion.",
    source: "packages/react/src/feedback.tsx",
    playground: false,
  }),
  entry({
    slug: "empty-state",
    title: "Empty State",
    group: "Feedback",
    publicExports: [
      "EmptyState",
      "EmptyStateMedia",
      "EmptyStateTitle",
      "EmptyStateDescription",
      "EmptyStateActions",
    ],
    summary: "Structured empty-result content with consumer-owned actions.",
    api: [
      "title level: 2 through 6",
      "compositional media/description/actions",
    ],
    accessibility:
      "Selectable heading level lets consumers preserve their document outline; application state remains external.",
    source: "packages/react/src/feedback.tsx",
    playground: false,
  }),
] satisfies readonly CatalogueEntry[]);

export interface LayoutEntry {
  readonly slug: string;
  readonly title: string;
  readonly route: string;
  readonly publicExports: readonly string[];
  readonly summary: string;
  readonly api: readonly string[];
  readonly source: string;
}

export const layouts = Object.freeze([
  {
    slug: "container",
    title: "Container",
    route: "/layout/container/",
    publicExports: ["Container"],
    summary:
      "Centered content-width boundary with prose, wide, and full sizes.",
    api: ["size: prose | wide | full"],
    source: "packages/react/src/layout.tsx",
  },
  {
    slug: "stack",
    title: "Stack",
    route: "/layout/stack/",
    publicExports: ["Stack"],
    summary: "Vertical flow with canonical gaps.",
    api: ["gap: 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16"],
    source: "packages/react/src/layout.tsx",
  },
  {
    slug: "inline",
    title: "Inline",
    route: "/layout/inline/",
    publicExports: ["Inline"],
    summary: "Non-wrapping horizontal flow.",
    api: ["gap", "align: start | center | end | baseline"],
    source: "packages/react/src/layout.tsx",
  },
  {
    slug: "cluster",
    title: "Cluster",
    route: "/layout/cluster/",
    publicExports: ["Cluster"],
    summary: "Wrapping horizontal group for actions and metadata.",
    api: ["gap", "align: start | center | end | baseline"],
    source: "packages/react/src/layout.tsx",
  },
  {
    slug: "grid",
    title: "Grid",
    route: "/layout/grid/",
    publicExports: ["Grid"],
    summary: "Intrinsic responsive grid or explicit one-to-four columns.",
    api: ["minItemWidth: sm | md | lg", "columns: 1 | 2 | 3 | 4", "gap"],
    source: "packages/react/src/layout.tsx",
  },
] satisfies readonly LayoutEntry[]);

export const repositorySourceBase =
  "https://github.com/Combric/combric/blob/main/";

export function sourceUrl(source: string): string {
  return `${repositorySourceBase}${source}`;
}
