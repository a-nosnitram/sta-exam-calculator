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
      <div className="w-[300px] min-h-[210px]">
        <div className="h-full min-h-[210px] rounded-lg border border-border/70 bg-background/80 backdrop-blur-xl shadow-[0_10px_30px_-18px_rgba(0,0,0,0.45)] flex items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="w-[300px] min-h-[110px]">
      <div className="h-full min-h-[110px] rounded-lg border border-border/70 bg-background/80 backdrop-blur-xl shadow-[0_10px_30px_-18px_rgba(0,0,0,0.45)] p-4 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-normal tracking-tight leading-none">
            <span className="font-semibold">MMS</span>
            <span className="font-normal">Calc</span>
          </h1>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/a-nosnitram/sta-exam-calculator/issues/new"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bug className="size-4" />
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
                className="size-4 opacity-60 hover:opacity-100 transition-opacity dark:invert"
              />
            </a>
          </div>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Check us out on GitHub and report any bugs you find! We welcome
          contributions :)
        </p>

        <div className="mt-auto pt-4">
          {isCorrectPage ? (
            <Button onClick={handleOpenDialog} className="w-full h-9">
              Calculate grades
            </Button>
          ) : (
            <Button onClick={handleRedirect} className="w-full h-9">
              Go to MySaint/MyCourses
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
