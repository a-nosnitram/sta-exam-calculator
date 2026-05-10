console.log("background script loaded");
import { scrapeCourseworkLinksFromMySaint } from "@src/scripts/scrape_cw_grades";

// listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message in background script:", request);
  if (request.type === "SCRAPE_CW_LINKS") {
    // call the scrape links function from scrape_cw_grades.ts
    for (const link of request.links) {
      scrapeCourseworkLinksFromMySaint(link);
    }
    sendResponse({ status: "success" });
  }
});
