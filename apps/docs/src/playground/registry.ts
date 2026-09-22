export type Control =
  | { readonly kind: "boolean"; readonly name: string; readonly label: string }
  | {
      readonly kind: "text";
      readonly name: string;
      readonly label: string;
      readonly maxLength: number;
    }
  | {
      readonly kind: "number";
      readonly name: string;
      readonly label: string;
      readonly min: number;
      readonly max: number;
      readonly step: number;
    }
  | {
      readonly kind: "enum";
      readonly name: string;
      readonly label: string;
      readonly options: readonly string[];
    };

export type PlaygroundProps = Readonly<
  Record<string, string | number | boolean>
>;

export interface PlaygroundEntry {
  readonly id: string;
  readonly label: string;
  readonly controls: readonly Control[];
  readonly defaults: PlaygroundProps;
  readonly code: (props: PlaygroundProps) => string;
}

const quote = (value: unknown) => JSON.stringify(String(value));
const bool = (name: string, value: unknown) => (value ? ` ${name}` : "");

export const playgroundEntries = Object.freeze([
  {
    id: "button",
    label: "Button",
    controls: [
      {
        kind: "enum",
        name: "variant",
        label: "Variant",
        options: ["primary", "secondary", "ghost"],
      },
      {
        kind: "enum",
        name: "size",
        label: "Size",
        options: ["sm", "md", "lg"],
      },
      { kind: "boolean", name: "disabled", label: "Disabled" },
      { kind: "text", name: "text", label: "Text", maxLength: 48 },
    ],
    defaults: {
      variant: "primary",
      size: "md",
      disabled: false,
      text: "Save changes",
    },
    code: (p) =>
      `<Button variant=${quote(p.variant)} size=${quote(p.size)}${bool("disabled", p.disabled)}>${String(p.text)}</Button>`,
  },
  {
    id: "badge",
    label: "Badge",
    controls: [
      {
        kind: "enum",
        name: "variant",
        label: "Variant",
        options: ["neutral", "accent"],
      },
      { kind: "text", name: "text", label: "Text", maxLength: 32 },
    ],
    defaults: { variant: "accent", text: "Active" },
    code: (p) => `<Badge variant=${quote(p.variant)}>${String(p.text)}</Badge>`,
  },
  {
    id: "input",
    label: "Input",
    controls: [
      {
        kind: "text",
        name: "placeholder",
        label: "Placeholder",
        maxLength: 48,
      },
      { kind: "boolean", name: "invalid", label: "Invalid" },
      { kind: "boolean", name: "disabled", label: "Disabled" },
    ],
    defaults: {
      placeholder: "person@example.com",
      invalid: false,
      disabled: false,
    },
    code: (p) =>
      `<Input aria-label="Email" placeholder=${quote(p.placeholder)}${p.invalid ? ` aria-invalid="true"` : ""}${bool("disabled", p.disabled)} />`,
  },
  {
    id: "switch",
    label: "Switch",
    controls: [
      { kind: "boolean", name: "checked", label: "Checked" },
      { kind: "boolean", name: "disabled", label: "Disabled" },
      { kind: "text", name: "text", label: "Label", maxLength: 40 },
    ],
    defaults: { checked: true, disabled: false, text: "Notifications" },
    code: (p) =>
      `<Label><Switch checked={${Boolean(p.checked)}} onChange={() => {}}${bool("disabled", p.disabled)} /> ${String(p.text)}</Label>`,
  },
  {
    id: "alert",
    label: "Alert",
    controls: [
      {
        kind: "enum",
        name: "tone",
        label: "Tone",
        options: ["neutral", "error"],
      },
      { kind: "text", name: "title", label: "Title", maxLength: 48 },
      {
        kind: "text",
        name: "description",
        label: "Description",
        maxLength: 96,
      },
    ],
    defaults: {
      tone: "neutral",
      title: "Import ready",
      description: "Review the mapped fields.",
    },
    code: (p) =>
      `<Alert tone=${quote(p.tone)}><AlertTitle>${String(p.title)}</AlertTitle><AlertDescription>${String(p.description)}</AlertDescription></Alert>`,
  },
  {
    id: "progress",
    label: "Progress",
    controls: [
      {
        kind: "number",
        name: "value",
        label: "Value",
        min: 0,
        max: 100,
        step: 5,
      },
    ],
    defaults: { value: 60 },
    code: (p) =>
      `<Progress aria-label="Import progress" value={${Number(p.value)}} max={100} />`,
  },
  {
    id: "tabs",
    label: "Tabs",
    controls: [
      {
        kind: "enum",
        name: "value",
        label: "Selected tab",
        options: ["overview", "activity"],
      },
    ],
    defaults: { value: "overview" },
    code: (p) =>
      `<Tabs value=${quote(p.value)} onValueChange={() => {}}><TabsList aria-label="Project sections"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList><TabsContent value="overview">Overview panel</TabsContent><TabsContent value="activity">Activity panel</TabsContent></Tabs>`,
  },
  {
    id: "dialog",
    label: "Dialog",
    controls: [{ kind: "boolean", name: "open", label: "Open" }],
    defaults: { open: false },
    code: (p) =>
      `<Dialog open={${Boolean(p.open)}} onOpenChange={() => {}}><DialogTrigger>Open dialog</DialogTrigger><DialogContent><DialogTitle>Confirm</DialogTitle><DialogDescription>Review the operation.</DialogDescription><DialogClose>Close</DialogClose></DialogContent></Dialog>`,
  },
] satisfies readonly PlaygroundEntry[]);

export function getPlaygroundEntry(id: string): PlaygroundEntry {
  const entry = playgroundEntries.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Unknown Playground family: ${id}`);
  return entry;
}

export function validateProps(
  entry: PlaygroundEntry,
  input: unknown,
): PlaygroundProps {
  const candidate =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};
  const result: Record<string, string | number | boolean> = {};
  for (const control of entry.controls) {
    const value = candidate[control.name] ?? entry.defaults[control.name];
    if (control.kind === "boolean") result[control.name] = Boolean(value);
    if (control.kind === "text")
      result[control.name] = String(value).slice(0, control.maxLength);
    if (control.kind === "number")
      result[control.name] = Math.min(
        control.max,
        Math.max(control.min, Number(value)),
      );
    if (control.kind === "enum")
      result[control.name] = control.options.includes(String(value))
        ? String(value)
        : (control.options[0] ?? "");
  }
  return Object.freeze(result);
}
