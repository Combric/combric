import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateTitle,
  Field,
  FieldDescription,
  FieldLegend,
  FieldMessage,
  Fieldset,
  Input,
  InputGroup,
  Label,
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Radio,
  RadioGroup,
  Select,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastViewport,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@combric/react";
import type { ComponentType } from "react";

export interface ExampleDefinition {
  readonly Component: ComponentType;
  readonly source: string;
}

const define = (Component: ComponentType, source: string): ExampleDefinition =>
  Object.freeze({ Component, source: source.trim() });

export const examples: Readonly<Record<string, ExampleDefinition>> = {
  button: define(
    () => <Button>Save changes</Button>,
    `import { Button } from "@combric/react";

export function Example() {
  return <Button>Save changes</Button>;
}`,
  ),
  toggle: define(
    () => <Toggle defaultPressed>Pin project</Toggle>,
    `import { Toggle } from "@combric/react";

export function Example() {
  return <Toggle defaultPressed>Pin project</Toggle>;
}`,
  ),
  "toggle-group": define(
    () => (
      <ToggleGroup type="single" defaultValue="list" aria-label="View">
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      </ToggleGroup>
    ),
    `import { ToggleGroup, ToggleGroupItem } from "@combric/react";

export function Example() {
  return (
    <ToggleGroup type="single" defaultValue="list" aria-label="View">
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
    </ToggleGroup>
  );
}`,
  ),
  label: define(
    () => <Label htmlFor="label-example">Project name</Label>,
    `import { Label } from "@combric/react";

export function Example() {
  return <Label htmlFor="project">Project name</Label>;
}`,
  ),
  input: define(
    () => <Input aria-label="Project name" placeholder="Combric docs" />,
    `import { Input } from "@combric/react";

export function Example() {
  return <Input aria-label="Project name" placeholder="Combric docs" />;
}`,
  ),
  textarea: define(
    () => <Textarea aria-label="Notes" defaultValue="Package-first UI." />,
    `import { Textarea } from "@combric/react";

export function Example() {
  return <Textarea aria-label="Notes" defaultValue="Package-first UI." />;
}`,
  ),
  checkbox: define(
    () => (
      <Label>
        <Checkbox defaultChecked /> Include archived projects
      </Label>
    ),
    `import { Checkbox, Label } from "@combric/react";

export function Example() {
  return <Label><Checkbox defaultChecked /> Include archived projects</Label>;
}`,
  ),
  "radio-group": define(
    () => (
      <RadioGroup name="plan-example" defaultValue="starter" aria-label="Plan">
        <Label>
          <Radio value="starter" /> Starter
        </Label>
        <Label>
          <Radio value="pro" /> Pro
        </Label>
      </RadioGroup>
    ),
    `import { Label, Radio, RadioGroup } from "@combric/react";

export function Example() {
  return (
    <RadioGroup name="plan" defaultValue="starter" aria-label="Plan">
      <Label><Radio value="starter" /> Starter</Label>
      <Label><Radio value="pro" /> Pro</Label>
    </RadioGroup>
  );
}`,
  ),
  switch: define(
    () => (
      <Label>
        <Switch defaultChecked /> Notifications
      </Label>
    ),
    `import { Label, Switch } from "@combric/react";

export function Example() {
  return <Label><Switch defaultChecked /> Notifications</Label>;
}`,
  ),
  select: define(
    () => (
      <Select aria-label="Region" defaultValue="eu">
        <option value="eu">Europe</option>
        <option value="us">United States</option>
      </Select>
    ),
    `import { Select } from "@combric/react";

export function Example() {
  return <Select aria-label="Region" defaultValue="eu"><option value="eu">Europe</option><option value="us">United States</option></Select>;
}`,
  ),
  slider: define(
    () => <Slider aria-label="Volume" defaultValue="50" min="0" max="100" />,
    `import { Slider } from "@combric/react";

export function Example() {
  return <Slider aria-label="Volume" defaultValue="50" min="0" max="100" />;
}`,
  ),
  field: define(
    () => (
      <Field invalid>
        <Label>Email</Label>
        <Input defaultValue="invalid" />
        <FieldDescription>Use your work address.</FieldDescription>
        <FieldMessage>Enter a valid email.</FieldMessage>
      </Field>
    ),
    `import { Field, FieldDescription, FieldMessage, Input, Label } from "@combric/react";

export function Example() {
  return <Field invalid><Label>Email</Label><Input /><FieldDescription>Use your work address.</FieldDescription><FieldMessage>Enter a valid email.</FieldMessage></Field>;
}`,
  ),
  fieldset: define(
    () => (
      <Fieldset>
        <FieldLegend>Preferences</FieldLegend>
        <Label>
          <Checkbox /> Weekly summary
        </Label>
      </Fieldset>
    ),
    `import { Checkbox, FieldLegend, Fieldset, Label } from "@combric/react";

export function Example() {
  return <Fieldset><FieldLegend>Preferences</FieldLegend><Label><Checkbox /> Weekly summary</Label></Fieldset>;
}`,
  ),
  "input-group": define(
    () => (
      <InputGroup>
        <span aria-hidden="true">https://</span>
        <Input aria-label="Project domain" defaultValue="combric.dev" />
      </InputGroup>
    ),
    `import { Input, InputGroup } from "@combric/react";

export function Example() {
  return <InputGroup><span aria-hidden="true">https://</span><Input aria-label="Project domain" /></InputGroup>;
}`,
  ),
  breadcrumb: define(
    () => (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Docs</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    ),
    `import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@combric/react";

export function Example() {
  return <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Docs</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>;
}`,
  ),
  pagination: define(
    () => (
      <Pagination>
        <PaginationList>
          <PaginationItem>
            <PaginationPrevious disabled />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink current href="#">
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationList>
      </Pagination>
    ),
    `import { Pagination, PaginationItem, PaginationLink, PaginationList, PaginationNext, PaginationPrevious } from "@combric/react";

export function Example() {
  return <Pagination><PaginationList><PaginationItem><PaginationPrevious disabled /></PaginationItem><PaginationItem><PaginationLink current href="?page=1">1</PaginationLink></PaginationItem><PaginationItem><PaginationNext href="?page=2" /></PaginationItem></PaginationList></Pagination>;
}`,
  ),
  tabs: define(
    () => (
      <Tabs defaultValue="overview">
        <TabsList aria-label="Project sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview panel</TabsContent>
        <TabsContent value="activity">Activity panel</TabsContent>
      </Tabs>
    ),
    `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@combric/react";

export function Example() {
  return <Tabs defaultValue="overview"><TabsList aria-label="Project sections"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList><TabsContent value="overview">Overview panel</TabsContent><TabsContent value="activity">Activity panel</TabsContent></Tabs>;
}`,
  ),
  avatar: define(
    () => (
      <Avatar size="md">
        <AvatarImage src="/missing-avatar.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    ),
    `import { Avatar, AvatarFallback, AvatarImage } from "@combric/react";

export function Example() {
  return <Avatar size="md"><AvatarImage src="/ada.png" alt="Ada Lovelace" /><AvatarFallback>AL</AvatarFallback></Avatar>;
}`,
  ),
  badge: define(
    () => <Badge variant="accent">Active</Badge>,
    `import { Badge } from "@combric/react";

export function Example() {
  return <Badge variant="accent">Active</Badge>;
}`,
  ),
  card: define(
    () => (
      <Card>
        <CardHeader>
          <CardTitle>Project</CardTitle>
          <CardDescription>Current status</CardDescription>
        </CardHeader>
        <CardContent>Ready</CardContent>
      </Card>
    ),
    `import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@combric/react";

export function Example() {
  return <Card><CardHeader><CardTitle>Project</CardTitle><CardDescription>Current status</CardDescription></CardHeader><CardContent>Ready</CardContent></Card>;
}`,
  ),
  separator: define(
    () => (
      <div>
        First
        <Separator />
        Second
      </div>
    ),
    `import { Separator } from "@combric/react";

export function Example() {
  return <div>First<Separator />Second</div>;
}`,
  ),
  table: define(
    () => (
      <TableContainer aria-label="Project inventory">
        <Table>
          <TableCaption>Projects</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Docs</TableCell>
              <TableCell>Ready</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    ),
    `import { Table, TableBody, TableCaption, TableCell, TableContainer, TableHead, TableHeader, TableRow } from "@combric/react";

export function Example() {
  return <TableContainer aria-label="Project inventory"><Table><TableCaption>Projects</TableCaption><TableHeader><TableRow><TableHead>Project</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Docs</TableCell><TableCell>Ready</TableCell></TableRow></TableBody></Table></TableContainer>;
}`,
  ),
  "description-list": define(
    () => (
      <DescriptionList>
        <DescriptionTerm>Runtime</DescriptionTerm>
        <DescriptionDetails>React 19</DescriptionDetails>
        <DescriptionTerm>Styling</DescriptionTerm>
        <DescriptionDetails>Standard CSS</DescriptionDetails>
      </DescriptionList>
    ),
    `import { DescriptionDetails, DescriptionList, DescriptionTerm } from "@combric/react";

export function Example() {
  return <DescriptionList><DescriptionTerm>Runtime</DescriptionTerm><DescriptionDetails>React 19</DescriptionDetails></DescriptionList>;
}`,
  ),
  accordion: define(
    () => (
      <Accordion defaultValue="details">
        <AccordionItem value="details">
          <AccordionTrigger>Details</AccordionTrigger>
          <AccordionContent>Accessible disclosure content.</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
    `import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@combric/react";

export function Example() {
  return <Accordion defaultValue="details"><AccordionItem value="details"><AccordionTrigger>Details</AccordionTrigger><AccordionContent>Accessible disclosure content.</AccordionContent></AccordionItem></Accordion>;
}`,
  ),
  collapsible: define(
    () => (
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Technical details</CollapsibleTrigger>
        <CollapsibleContent>
          Package-first component catalogue.
        </CollapsibleContent>
      </Collapsible>
    ),
    `import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@combric/react";

export function Example() {
  return <Collapsible defaultOpen><CollapsibleTrigger>Technical details</CollapsibleTrigger><CollapsibleContent>Package-first component catalogue.</CollapsibleContent></Collapsible>;
}`,
  ),
  dialog: define(
    () => (
      <Dialog>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Confirm change</DialogTitle>
          <DialogDescription>
            This action updates the project.
          </DialogDescription>
          <DialogClose>Cancel</DialogClose>
        </DialogContent>
      </Dialog>
    ),
    `import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@combric/react";

export function Example() {
  return <Dialog><DialogTrigger>Open dialog</DialogTrigger><DialogContent><DialogTitle>Confirm change</DialogTitle><DialogDescription>This action updates the project.</DialogDescription><DialogClose>Cancel</DialogClose></DialogContent></Dialog>;
}`,
  ),
  drawer: define(
    () => (
      <Drawer>
        <DrawerTrigger>Filters</DrawerTrigger>
        <DrawerContent side="right">
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Limit visible results.</DrawerDescription>
          <DrawerClose>Done</DrawerClose>
        </DrawerContent>
      </Drawer>
    ),
    `import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "@combric/react";

export function Example() {
  return <Drawer><DrawerTrigger>Filters</DrawerTrigger><DrawerContent side="right"><DrawerTitle>Filters</DrawerTitle><DrawerDescription>Limit visible results.</DrawerDescription><DrawerClose>Done</DrawerClose></DrawerContent></Drawer>;
}`,
  ),
  "dropdown-menu": define(
    () => (
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    `import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@combric/react";

export function Example() {
  return <DropdownMenu><DropdownMenuTrigger>Actions</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>Edit</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem disabled>Archive</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}`,
  ),
  popover: define(
    () => (
      <Popover>
        <PopoverTrigger>Details</PopoverTrigger>
        <PopoverContent>Non-modal details</PopoverContent>
      </Popover>
    ),
    `import { Popover, PopoverContent, PopoverTrigger } from "@combric/react";

export function Example() {
  return <Popover><PopoverTrigger>Details</PopoverTrigger><PopoverContent>Non-modal details</PopoverContent></Popover>;
}`,
  ),
  tooltip: define(
    () => (
      <Tooltip>
        <TooltipTrigger>Help</TooltipTrigger>
        <TooltipContent>Keyboard shortcut: Ctrl+K</TooltipContent>
      </Tooltip>
    ),
    `import { Tooltip, TooltipContent, TooltipTrigger } from "@combric/react";

export function Example() {
  return <Tooltip><TooltipTrigger>Help</TooltipTrigger><TooltipContent>Keyboard shortcut: Ctrl+K</TooltipContent></Tooltip>;
}`,
  ),
  alert: define(
    () => (
      <Alert tone="error">
        <AlertTitle>Import failed</AlertTitle>
        <AlertDescription>Check the source file.</AlertDescription>
      </Alert>
    ),
    `import { Alert, AlertDescription, AlertTitle } from "@combric/react";

export function Example() {
  return <Alert tone="error"><AlertTitle>Import failed</AlertTitle><AlertDescription>Check the source file.</AlertDescription></Alert>;
}`,
  ),
  toast: define(
    () => (
      <ToastViewport aria-label="Notifications">
        <Toast duration={0}>
          <ToastTitle>Saved</ToastTitle>
          <ToastDescription>Your changes are available.</ToastDescription>
          <ToastClose>Dismiss</ToastClose>
        </Toast>
      </ToastViewport>
    ),
    `import { Toast, ToastClose, ToastDescription, ToastTitle, ToastViewport } from "@combric/react";

export function Example() {
  return <ToastViewport aria-label="Notifications"><Toast duration={0}><ToastTitle>Saved</ToastTitle><ToastDescription>Your changes are available.</ToastDescription><ToastClose>Dismiss</ToastClose></Toast></ToastViewport>;
}`,
  ),
  progress: define(
    () => <Progress aria-label="Import progress" value={60} max={100} />,
    `import { Progress } from "@combric/react";

export function Example() {
  return <Progress aria-label="Import progress" value={60} max={100} />;
}`,
  ),
  spinner: define(
    () => <Spinner aria-label="Refreshing projects" />,
    `import { Spinner } from "@combric/react";

export function Example() {
  return <Spinner aria-label="Refreshing projects" />;
}`,
  ),
  skeleton: define(
    () => <Skeleton style={{ minHeight: "3rem" }} />,
    `import { Skeleton } from "@combric/react";

export function Example() {
  return <Skeleton style={{ minHeight: "3rem" }} />;
}`,
  ),
  "empty-state": define(
    () => (
      <EmptyState>
        <EmptyStateTitle level={3}>No projects</EmptyStateTitle>
        <EmptyStateDescription>
          Create a project to begin.
        </EmptyStateDescription>
        <EmptyStateActions>
          <Button>Create project</Button>
        </EmptyStateActions>
      </EmptyState>
    ),
    `import { Button, EmptyState, EmptyStateActions, EmptyStateDescription, EmptyStateTitle } from "@combric/react";

export function Example() {
  return <EmptyState><EmptyStateTitle level={3}>No projects</EmptyStateTitle><EmptyStateDescription>Create a project to begin.</EmptyStateDescription><EmptyStateActions><Button>Create project</Button></EmptyStateActions></EmptyState>;
}`,
  ),
};
