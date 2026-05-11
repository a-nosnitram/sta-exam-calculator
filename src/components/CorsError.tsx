// src/components/CorsError.tsx
import { Button } from "@src/components/ui/button";
import { scrapeCourseworkLinksFromMySaint } from "@src/scripts/scrape_cw_grades";
import { runtime } from "webextension-polyfill";

export function CorsError() {
  const handleRetry = () => {
    const links = scrapeCourseworkLinksFromMySaint(document);
    runtime.sendMessage({ type: "SCRAPE_CW_GRADES", links });
  };

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <p className="text-destructive font-medium text-lg">
        You're probably logged out of MMS.
      </p>
      <div className="flex gap-2">
        <Button>
          <a
            href="https://mms.st-andrews.ac.uk/mms/"
            target="_blank"
            rel="noreferrer"
            className="text-white!"
          >
            Log in to MMS
          </a>
        </Button>
        <Button onClick={handleRetry} className="text-white!">
          Retry
        </Button>
      </div>
    </div>
  );
}
