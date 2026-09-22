import { useState } from "react";

export interface CopyButtonProps {
  readonly text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.append(area);
        area.select();
        const copied = document.execCommand("copy");
        area.remove();
        if (!copied) throw new Error("Copy command was unavailable");
      }
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        className="combric-button"
        data-size="sm"
        onClick={copy}
        aria-label="Copy example code"
      >
        Copy code
      </button>{" "}
      <span role="status" aria-live="polite">
        {status === "copied"
          ? "Copied."
          : status === "error"
            ? "Copy failed. Select the code manually."
            : ""}
      </span>
    </div>
  );
}
