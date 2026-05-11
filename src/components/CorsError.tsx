// src/components/CorsError.tsx
import { Button } from "@src/components/ui/button";
import { scrapeCourseworkLinksFromMySaint } from "@src/scripts/scrape_cw_grades";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { runtime } from "webextension-polyfill";

export function CorsError() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRetry = () => {
    setIsLoading(true);
    const links = scrapeCourseworkLinksFromMySaint(document);
    runtime.sendMessage({ type: "SCRAPE_CW_GRADES", links }).finally(() => {
      // Background script finishes quickly, but let's keep it loading
      // until the storage listener in index.tsx unmounts us if successful.
      setTimeout(() => setIsLoading(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <p className="text-destructive font-medium text-lg">
        You're probably logged out of MMS.
      </p>
      <div className="flex gap-2">
        <Button disabled={isLoading}>
          <a
            href="https://mms.st-andrews.ac.uk/mms/"
            target="_blank"
            rel="noreferrer"
            className="text-white!"
          >
            Log in to MMS
          </a>
        </Button>
        <Button
          onClick={handleRetry}
          className="text-white!"
          disabled={isLoading}
        >
          <RotateCcw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin-ccw" : ""}`}
          />
          {isLoading ? "Retrying..." : "Retry"}
        </Button>
      </div>
    </div>
  );
}
