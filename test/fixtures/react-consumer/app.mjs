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
  Cluster,
  Container,
  Grid,
  Inline,
  Stack,
} from "@combric/react";

export function renderFixture() {
  return renderToStaticMarkup(
    createElement(
      Container,
      { size: "wide" },
      createElement(
        Stack,
        { gap: "6" },
        createElement(
          Inline,
          { align: "baseline", gap: "3" },
          createElement("strong", null, "Combric consumer"),
          createElement("span", null, "Layout foundation"),
        ),
        createElement(
          Grid,
          { gap: "4", minItemWidth: "md" },
          createElement(
            Card,
            null,
            createElement(
              CardHeader,
              null,
              createElement(CardTitle, null, "Components"),
              createElement(CardDescription, null, "Standard CSS consumer"),
            ),
            createElement(
              CardContent,
              null,
              createElement(Button, null, "Save"),
            ),
          ),
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
        createElement(
          Cluster,
          { gap: "2" },
          createElement("span", null, "React"),
          createElement("span", null, "CSS Grid"),
        ),
      ),
    ),
  );
}
