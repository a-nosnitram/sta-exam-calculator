// src/pages/popup/Popup.tsx
import { Button } from "@src/components/ui/button";
import { useEffect, useState } from "react";
import { tabs } from "webextension-polyfill";

const TARGET_URL =
  "https://mysaint.st-andrews.ac.uk/uPortal/f/my-courses/normal/render.uP";

export default function Popup() {
  const [isCorrectPage, setIsCorrectPage] = useState<boolean | null>(null);

  useEffect(() => {
    tabs.query({ active: true, currentWindow: true }).then((activeTabs) => {
      const activeTab = activeTabs[0];
      setIsCorrectPage(activeTab?.url === TARGET_URL);
    });
  }, []);

  const handleOpenDialog = async () => {
    try {
      const [tab] = await tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) return;

      try {
        await tabs.sendMessage(tab.id, { action: "TOGGLE_STA_CALCULATOR" });
      } catch (err) {
        console.error(err);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRedirect = () => {
    tabs.create({ url: TARGET_URL });
  };

  if (isCorrectPage === null) {
    return (
      <div className="p-4 w-64 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-72 p-6 flex flex-col items-center text-center">
      <h1 className="text-2xl font-bold tracking-tight mb-6">STA Extension</h1>

      {isCorrectPage ? (
        <Button onClick={handleOpenDialog} className="w-full">
          Calculate grades
        </Button>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
            Go to there to calculate your exam grades.
          </p>

          <Button onClick={handleRedirect} className="w-full">
            Go to MySaint/MyCourses
          </Button>
        </div>
      )}
    </div>
  );
}
