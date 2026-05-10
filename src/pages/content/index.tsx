// src/pages/content/index.tsx
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

function ContentApp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Listen for the message from Popup.tsx
    const messageListener = (request: any) => {
      if (request.action === "TOGGLE_STA_CALCULATOR") {
        alert("sadasdsad");
        setIsOpen(true);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Cleanup listener on unmount
    return () => chrome.runtime.onMessage.removeListener(messageListener);
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

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Your calculator inputs and logic go here...
          </p>
        </div>
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
