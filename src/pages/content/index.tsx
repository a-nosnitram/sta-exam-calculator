// src/pages/content/index.tsx
import { GradesTable } from "@src/components/GradesTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import { scrapeCourseworkLinksFromMySaint } from "@src/scripts/scrape_cw_grades";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { scrapeOverallModuleGrades } from "@src/scripts/scrape_module_grades";

function ContentApp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isMySaint = window.location.href.includes(
      "https://mysaint.st-andrews.ac.uk/uPortal/f/my-courses/normal/render.uP",
    );
    if (!isMySaint) {
      return;
    }
    // Listen for the message from Popup.tsx
    const messageListener = (request: any) => {
      if (request.action === "TOGGLE_STA_CALCULATOR") {
        setIsOpen(true);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    let observer: MutationObserver | null = null;

    const scrapeAndStoreOverallGrades = () => {
      const overallGrades = scrapeOverallModuleGrades(document);
      if (Object.keys(overallGrades).length > 0) {
        console.log("Overall module grades:", overallGrades);
        chrome.storage.local.set({ overallModuleGrades: overallGrades });
      }
    };

    const scrapeAndSend = () => {
      const links = scrapeCourseworkLinksFromMySaint(document);
      chrome.runtime.sendMessage({ type: "SCRAPE_CW_GRADES", links });
    };

    scrapeAndStoreOverallGrades();

    scrapeAndSend();
    observer = new MutationObserver(() => {
      scrapeAndSend();
      scrapeAndStoreOverallGrades();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Cleanup listener on unmount
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      observer?.disconnect();
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[700px] bg-background/80 backdrop-blur-xl border-border/50">
        <div className="sta-extension-wrapper">
          <DialogHeader>
            <DialogTitle>STA Exam Calculator</DialogTitle>
            <DialogDescription>
              Calculate your final grades directly on this page.
            </DialogDescription>
          </DialogHeader>
          <GradesTable />
        </div>
      </DialogContent>{" "}
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
