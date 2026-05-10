console.log("background script loaded");
import { scrapeCourseworkGrade } from "@src/scripts/scrape_cw_grades";
import { runtime, storage } from "webextension-polyfill";

// listen for messages from content scripts
runtime.onMessage.addListener(async (request: any) => {
  console.log("Received message in background script:", request);
  if (request.type === "SCRAPE_CW_GRADES") {
    // call the scrape function from scrape_cw_grades.ts
    let cw_grades = [];

    if (!request.links || request.links.length === 0) {
      console.log("No links provided to scrape, skipping...");
      return { status: "success", skipped: true };
    }

    for (const link of request.links) {
      console.log(`Scraping coursework grade from link: ${link}`);
      try {
        const result = await scrapeCourseworkGrade(link);
        if (result) {
          const [grade, moduleCode] = result;
          cw_grades.push({ module: moduleCode, grade });
        }
      } catch (error) {
        console.error(`Failed to scrape coursework grade from ${link}:`, error);
      }
    }
    // store the grades in local storage with the module code as the key and the grade as the value
    await storage.local.set({ courseworkGrades: cw_grades });
    return { status: "success" };
  }
});
