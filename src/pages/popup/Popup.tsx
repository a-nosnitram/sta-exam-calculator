// src/pages/popup/Popup.tsx
import { Button } from "@src/components/ui/button";
import { Bug } from "lucide-react";
import { useEffect, useState } from "react";
import { tabs } from "webextension-polyfill";

const TARGET_URL =
  "https://mysaint.st-andrews.ac.uk/uPortal/f/my-courses/normal/render.uP";

export default function Popup() {
  const [isCorrectPage, setIsCorrectPage] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Initial check on mount
    tabs.query({ active: true, currentWindow: true }).then((activeTabs) => {
      const activeTab = activeTabs[0];
      setIsCorrectPage(activeTab?.url === TARGET_URL);
    });

    // 2. Listen for dynamic URL changes
    const handleTabUpdate = (tabId: number, changeInfo: any, tab: any) => {
      if (tab.active && (changeInfo.url || tab.url)) {
        const currentUrl = changeInfo.url || tab.url;
        setIsCorrectPage(currentUrl === TARGET_URL);
      }
    };

    tabs.onUpdated.addListener(handleTabUpdate);

    // Cleanup listener on unmount
    return () => {
      tabs.onUpdated.removeListener(handleTabUpdate);
    };
  }, []);

  const handleOpenDialog = async () => {
    try {
      const [tab] = await tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;
      await tabs.sendMessage(tab.id, { action: "TOGGLE_STA_CALCULATOR" });
    } catch (error) {
      console.error(error);
    }
  };

  const handleRedirect = async () => {
    // Update the current tab instead of opening a new one so the popup stays open
    const [tab] = await tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      tabs.update(tab.id, { url: TARGET_URL });
    }
  };

  if (isCorrectPage === null) {
    return (
      <div className="w-72 min-h-[240px] p-4 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-72 min-h-[240px] pl-8 px-4 flex flex-col items-center justify-center text-center relative">
      <div className="absolute bottom-0 left-0 w-full pl-3 flex justify-between items-center">
        <a
          href="https://github.com/a-nosnitram/sta-exam-calculator/issues/new"
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bug className="size-5" />
        </a>
        <a
          href="https://github.com/a-nosnitram/sta-exam-calculator"
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <img
            src="/GitHub_Invertocat_Black.svg"
            alt="GitHub"
            className="size-5 opacity-50 hover:opacity-100 transition-opacity"
          />
        </a>
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">MMS Calc </h1>

      {isCorrectPage ? (
        <Button onClick={handleOpenDialog} className="w-full">
          Calculate grades
        </Button>
      ) : (
        <div className="flex flex-col items-center w-full">
          <Button onClick={handleRedirect} className="w-full">
            Go to MySaint/MyCourses
          </Button>
        </div>
      )}
    </div>
  );
}
