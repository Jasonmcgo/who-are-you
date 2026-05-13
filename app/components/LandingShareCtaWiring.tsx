"use client";

// CC-HEADER-NAV-AND-EMAIL-GATE — client-side wiring for the static
// landing page's "Pass along to someone that matters" buttons. The
// landing markup arrives via `dangerouslySetInnerHTML` so embedded
// `<script>` tags don't execute. This client component mounts after
// hydration and attaches click handlers to any `[data-share-cta]`
// anchors in the document, copying the assessment URL to clipboard
// and flashing a brief confirmation message.

import { useEffect } from "react";

const SHARE_URL = "https://the50degreelife.com/assessment";
const CONFIRM_TEXT = "Link copied — paste it in an email or message";
const REVERT_MS = 2000;

export default function LandingShareCtaWiring() {
  useEffect(() => {
    const anchors = document.querySelectorAll<HTMLAnchorElement>(
      "[data-share-cta]"
    );
    const handlers: Array<{
      el: HTMLAnchorElement;
      handler: (ev: MouseEvent) => void;
    }> = [];
    anchors.forEach((a) => {
      const originalText = a.textContent ?? "";
      const handler = (ev: MouseEvent) => {
        ev.preventDefault();
        const showConfirm = () => {
          a.textContent = CONFIRM_TEXT;
          window.setTimeout(() => {
            a.textContent = originalText;
          }, REVERT_MS);
        };
        const legacyCopy = () => {
          try {
            const tmp = document.createElement("textarea");
            tmp.value = SHARE_URL;
            tmp.style.position = "fixed";
            tmp.style.opacity = "0";
            document.body.appendChild(tmp);
            tmp.select();
            document.execCommand("copy");
            document.body.removeChild(tmp);
            showConfirm();
          } catch {
            a.textContent = `Copy this link: ${SHARE_URL}`;
            window.setTimeout(() => {
              a.textContent = originalText;
            }, REVERT_MS * 2);
          }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(SHARE_URL).then(showConfirm, legacyCopy);
        } else {
          legacyCopy();
        }
      };
      a.addEventListener("click", handler);
      handlers.push({ el: a, handler });
    });
    return () => {
      for (const { el, handler } of handlers) {
        el.removeEventListener("click", handler);
      }
    };
  }, []);
  return null;
}
