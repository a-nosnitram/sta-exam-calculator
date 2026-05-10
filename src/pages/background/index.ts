console.log("background script loaded");
import { scrapeCourseworkGrade } from "@src/scripts/scrape_cw_grades";

// listen for messages from content scripts
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log("Received message in background script:", request);
  if (request.type === "SCRAPE_CW_GRADES") {
    // call the scrape function from scrape_cw_grades.ts
    let cw_grades = [];

    for (const link of request.links) {
      console.log(`Scraping coursework grade from link: ${link}`);
      const [grade, moduleCode] = (await scrapeCourseworkGrade(link)) ?? [
        0,
        "something went wrong",
      ];
      cw_grades.push({ module: moduleCode, grade });
    }
    // store the grades in local storage with the module code as the key and the grade as the value
    chrome.storage.local.set({ courseworkGrades: cw_grades });
    sendResponse({ status: "success" });
    return true; // indicate that we will send a response asynchronously
  }
});
