console.log("background script loaded");
import { scrapeCourseworkGrade } from "@src/scripts/scrape_cw_grades";
import { runtime, storage } from "webextension-polyfill";

const DEFAULT_ICON_PATHS = {
  32: "icon-32.png",
  128: "icon-128.png",
};

const DARK_ICON_PATHS = {
  32: "icon-white-32.png",
  128: "icon-white-128.png",
};

function setActionIconByTheme(isDark: boolean) {
  chrome.action.setIcon({
    path: isDark ? DARK_ICON_PATHS : DEFAULT_ICON_PATHS,
  });
}

// listen for messages from content scripts
runtime.onMessage.addListener(async (request: any) => {
  console.log("Received message in background script:", request);

  if (request.type === "SET_ICON_THEME") {
    setActionIconByTheme(Boolean(request.isDark));
    return { status: "success" };
  }

  if (request.type === "SCRAPE_CW_GRADES") {
    // call the scrape function from scrape_cw_grades.ts
    const cwGrades: { module: string; grade: number; academicYear: string }[] =
      [];

    if (!request.links || request.links.length === 0) {
      console.log("No links provided to scrape, skipping...");
      return { status: "success", skipped: true };
    }

    for (const link of request.links) {
      console.log(`Scraping coursework grade from link: ${link}`);
      try {
        const result = await scrapeCourseworkGrade(link);
        if (result) {
          cwGrades.push(result);
        }
      } catch (error) {
        console.error(`Failed to scrape coursework grade from ${link}:`, error);
      }
    }
    // store the grades in local storage with the module code as the key and the grade as the value
    await storage.local.set({ courseworkGrades: cwGrades });
    return { status: "success" };
  }
});
