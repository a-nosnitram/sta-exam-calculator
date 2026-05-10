// src/pages/popup/Popup.tsx
import { Button } from "@src/components/ui/button";

export default function Popup() {
  const handleOpenDialog = async () => {
    console.log("Button clicked, querying tabs...");

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.id) {
        console.error("No active tab found");
        return;
      }

      console.log("Sending message to tab ID:", tab.id);

      // Add a callback to check for errors
      chrome.tabs.sendMessage(
        tab.id,
        { action: "TOGGLE_STA_CALCULATOR" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Message failed. Is the content script running on this page?",
              chrome.runtime.lastError.message,
            );
          } else {
            console.log("Message delivered successfully!");
          }
        },
      );
    } catch (error) {
      console.error("Tab query failed:", error);
    }
  };

  return (
    <div className="p-4 w-64">
      <h1 className="text-xl font-bold tracking-tight mb-4">STA Extension</h1>

      <Button onClick={handleOpenDialog} className="w-full">
        Calculate grades
      </Button>
    </div>
  );
}
