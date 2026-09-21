import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@combric/react";

export function renderFixture() {
  return renderToStaticMarkup(
    createElement(
      Card,
      null,
      createElement(
        CardHeader,
        null,
        createElement(CardTitle, null, "Combric consumer"),
        createElement(CardDescription, null, "Standard CSS consumer"),
      ),
      createElement(CardContent, null, createElement(Button, null, "Save")),
      createElement(
        Accordion,
        { defaultValue: "details" },
        createElement(
          AccordionItem,
          { value: "details" },
          createElement(AccordionTrigger, null, "Details"),
          createElement(AccordionContent, null, "Production primitives"),
        ),
      ),
    ),
  );
}
