// src/pages/content/index.tsx
import { GradesTable } from "@src/components/GradesTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { scrapeCourseworkLinksFromMySaint } from "@src/scripts/scrape_cw_grades";

function ContentApp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Listen for the message from Popup.tsx
    const messageListener = (request: any) => {
      if (request.action === "TOGGLE_STA_CALCULATOR") {
        setIsOpen(true);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    let observer: MutationObserver | null = null;
    const isMySaint = window.location.href.includes(
      "https://mysaint.st-andrews.ac.uk/uPortal/f/my-courses/normal/render.uP",
    );

    const scrapeAndSend = () => {
      if (!isMySaint) {
        return;
      }

      const links = scrapeCourseworkLinksFromMySaint(document);
      chrome.runtime.sendMessage({ type: "SCRAPE_CW_LINKS", links });
    };

    if (isMySaint) {
      scrapeAndSend();
      observer = new MutationObserver(scrapeAndSend);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Cleanup listener on unmount
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      observer?.disconnect();
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>STA Exam Calculator</DialogTitle>
          <DialogDescription>
            Calculate your final grades directly on this page.
          </DialogDescription>
        </DialogHeader>
        <GradesTable />
      </DialogContent>
    </Dialog>
  );
}

// -----------------------------------------
// Mount React to the Host Webpage
// -----------------------------------------
const init = () => {
  const rootContainer = document.createElement("div");
  rootContainer.id = "sta-calculator-extension-root";
  document.body.appendChild(rootContainer);

  const root = createRoot(rootContainer);
  root.render(<ContentApp />);
};

init();
