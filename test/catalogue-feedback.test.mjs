import assert from "node:assert/strict";
import test from "node:test";

import { createElement, createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateMedia,
  EmptyStateTitle,
  Progress,
  Skeleton,
  Spinner,
} from "@combric/react";

test("Alert is static by default and live semantics are explicit", () => {
  const staticMarkup = renderToStaticMarkup(
    createElement(
      Alert,
      { tone: "error" },
      createElement(AlertTitle, null, "Unable to save"),
      createElement(AlertDescription, null, "Review the highlighted fields."),
    ),
  );
  assert.match(staticMarkup, /<section/);
  assert.match(staticMarkup, /data-tone="error"/);
  assert.doesNotMatch(staticMarkup, /role=/);
  assert.doesNotMatch(staticMarkup, /aria-live=/);

  const politeMarkup = renderToStaticMarkup(
    createElement(Alert, { live: "polite" }, "Saved"),
  );
  assert.match(politeMarkup, /role="status"/);
  assert.match(politeMarkup, /aria-live="polite"/);

  const urgentMarkup = renderToStaticMarkup(
    createElement(Alert, { live: "assertive" }, "Connection lost"),
  );
  assert.match(urgentMarkup, /role="alert"/);
  assert.match(urgentMarkup, /aria-live="assertive"/);
});

test("Progress preserves native determinate and indeterminate contracts", () => {
  const determinate = renderToStaticMarkup(
    createElement(Progress, {
      "aria-label": "Upload",
      max: 200,
      value: 50,
    }),
  );
  assert.match(determinate, /<progress/);
  assert.match(determinate, /value="50"/);
  assert.match(determinate, /max="200"/);
  assert.match(determinate, /data-state="determinate"/);

  const indeterminate = renderToStaticMarkup(
    createElement(Progress, { "aria-label": "Processing" }),
  );
  assert.doesNotMatch(indeterminate, /value=/);
  assert.match(indeterminate, /max="100"/);
  assert.match(indeterminate, /data-state="indeterminate"/);
});

test("Spinner and Skeleton avoid noisy default announcements", () => {
  const decorativeSpinner = renderToStaticMarkup(createElement(Spinner));
  assert.match(decorativeSpinner, /aria-hidden="true"/);
  assert.doesNotMatch(decorativeSpinner, /role=/);

  const namedSpinner = renderToStaticMarkup(
    createElement(Spinner, { "aria-label": "Refreshing projects" }),
  );
  assert.match(namedSpinner, /role="status"/);
  assert.match(namedSpinner, /aria-label="Refreshing projects"/);
  assert.doesNotMatch(namedSpinner, /aria-hidden/);

  const skeleton = renderToStaticMarkup(
    createElement(Skeleton, { style: { height: 40 } }),
  );
  assert.match(skeleton, /aria-hidden="true"/);
  assert.doesNotMatch(skeleton, /role=/);
});

test("EmptyState exposes structured content with a selectable heading level", () => {
  const rootRef = createRef();
  const markup = renderToStaticMarkup(
    createElement(
      EmptyState,
      { ref: rootRef },
      createElement(EmptyStateMedia, { "aria-hidden": true }, "Document"),
      createElement(EmptyStateTitle, { level: 3 }, "No documents"),
      createElement(EmptyStateDescription, null, "Create a document to begin."),
      createElement(
        EmptyStateActions,
        null,
        createElement("button", { type: "button" }, "Create document"),
      ),
    ),
  );
  assert.match(markup, /<h3[^>]*>No documents<\/h3>/);
  assert.match(markup, /combric-empty-state__actions/);
  assert.doesNotMatch(markup, /role="status"/);
});
