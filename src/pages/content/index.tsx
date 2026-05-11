// src/pages/content/index.tsx
import { CorsError } from "@src/components/CorsError";
import { GradesTable } from "@src/components/GradesTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import { scrapeCourseworkLinksFromMySaint } from "@src/scripts/scrape_cw_grades";
import { scrapeOverallModuleGrades } from "@src/scripts/scrape_module_grades";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { runtime, storage } from "webextension-polyfill";
import "./style.css";

function ContentApp() {
  const [isOpen, setIsOpen] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const result = await storage.local.get("authError");
      setAuthError(!!result.authError);
    };

    if (isOpen) {
      checkAuth();
    }

    const listener = (changes: any) => {
      if (changes.authError) {
        setAuthError(!!changes.authError.newValue);
      }
    };

    storage.onChanged.addListener(listener);
    return () => storage.onChanged.removeListener(listener);
  }, [isOpen]);

  console.log(authError);

  useEffect(() => {
    const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncIconTheme = () => {
      runtime
        .sendMessage({
          type: "SET_ICON_THEME",
          isDark: colorSchemeQuery.matches,
        })
        .catch((error) => {
          console.warn(
            "Failed to sync icon theme with background script:",
            error,
          );
        });
    };

    syncIconTheme();

    const onThemeChange = () => syncIconTheme();
    colorSchemeQuery.addEventListener("change", onThemeChange);

    return () => {
      colorSchemeQuery.removeEventListener("change", onThemeChange);
    };
  }, []);

  useEffect(() => {
    const isMySaint = window.location.href.includes(
      "https://mysaint.st-andrews.ac.uk/",
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

    runtime.onMessage.addListener(messageListener);

    let observer: MutationObserver | null = null;

    const scrapeAndStoreOverallGrades = () => {
      const overallGrades = scrapeOverallModuleGrades(document);
      if (overallGrades.length > 0) {
        console.log("Overall module grades:", overallGrades);
      }
      storage.local.set({ overallModuleGrades: overallGrades });
    };

    const scrapeAndSend = () => {
      const links = scrapeCourseworkLinksFromMySaint(document);
      runtime.sendMessage({ type: "SCRAPE_CW_GRADES", links });
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
      runtime.onMessage.removeListener(messageListener);
      observer?.disconnect();
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl bg-background/80 backdrop-blur-xl border-border/50">
        <div className="sta-extension-wrapper">
          <DialogHeader>
            <DialogTitle className="font-normal">
              <span className="font-semibold">MMS</span>
              <span className="font-normal">Calc</span>
            </DialogTitle>
          </DialogHeader>
          {authError ? <CorsError /> : <GradesTable />}
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
<ContentApp />;
