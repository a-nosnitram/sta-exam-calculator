/*
    scrape coursework grades from module page
    needs to fetch in the background while user is on
    user is on: https://mysaint.st-andrews.ac.uk/uPortal/f/my-courses/normal/render.uP (MySaint/My Courses page)
    then we fetch "https://mms.st-andrews.ac.uk/mms/module/{year}/{semester}/&{module}/&{module}+Coursework/"
    for each module, extract the coursework grade and store it in local storage
*/

export interface CourseworkGrade {
  module: string;
  grade: number;
  academicYear: string;
}

// content script for when user is on https://mysaint.st-andrews.ac.uk/uPortal/f/my-courses/normal/render.uP
export function scrapeCourseworkLinksFromMySaint(doc: Document): string[] {
  return Array.from(
    doc.querySelectorAll('a.list-group-item[data-type="coursework"]'),
  )
    .filter((anchor) => {
      if (!(anchor instanceof HTMLAnchorElement)) {
        return false;
      }

      const href = anchor.href;
      const decodedHref = decodeURIComponent(href).toLowerCase();
      const label = (anchor.textContent ?? "").toLowerCase();

      /*
        for some godforsaken reason MySaint classifies Quizzes
        and Stacs Checks as a 'coursework' data-type... those
        break the parsing, so we need to filter them out
      */
      const isModuleLink = href.includes("mms.st-andrews.ac.uk/mms/module/");
      const isQuizLink = /\bquiz(?:zes)?\b/i.test(decodedHref);
      const isQuizLabel = /\bquiz(?:zes)?\b/i.test(label);
      const isStacsCheckLink = /\bstacs\s*check\b/i.test(decodedHref);
      const isExercise = /\bexercises?\b/i.test(decodedHref);

      return (
        isModuleLink &&
        !isQuizLink &&
        !isQuizLabel &&
        !isStacsCheckLink &&
        !isExercise
      );
    })
    .map((anchor) => (anchor as HTMLAnchorElement).href);
}

// returns the text content of the coursework page given its URL
async function fetchCourseworkPage(url: string): Promise<string> {
  const resp = await fetch(url, { credentials: "include" });
  if (!resp.ok) {
    throw new Error(
      `Failed to fetch coursework page: ${resp.status} ${resp.statusText}`,
    );
  }
  return await resp.text();
}

export function parseCourseworkGradeFromText(html: string): number {
  const text = html.replace(/\s+/g, " ").trim();
  // "Running average: 16.5"
  const match = text.match(
    /running\s*average:\s*(?::|=)?\s*(\d{1,3}(?:\.\d+)?)\s*(%?)/i,
  );
  if (!match) {
    throw new Error("Failed to parse coursework grade from text", {
      cause: text,
    });
  }
  if (match[2] === "%") {
    throw new Error(
      "Failed to parse coursework grade from text because it's % and we don't calculate them yet",
    );
  }
  return match ? Number.parseFloat(match[1]) : 0;
}

export async function scrapeCourseworkGrade(
  url: string,
): Promise<CourseworkGrade> {
  const html = await fetchCourseworkPage(url);
  // https://mms.st-andrews.ac.uk/mms/module/2025_6/S2/CS3052/CS3052+Coursework/
  const moduleUrlMatch = url.match(
    /mms\.st-andrews\.ac\.uk\/mms\/module\/(\d{4})_(\d+)\/[^/]+\/([^/]+)\//i,
  );
  if (!moduleUrlMatch) {
    throw new Error(`Failed to extract module code/year from URL: ${url}`);
  }
  const academicYear = `${moduleUrlMatch[1]}/${moduleUrlMatch[2]}`;
  const moduleCode = decodeURIComponent(moduleUrlMatch[3]).toUpperCase();
  const grade = parseCourseworkGradeFromText(html);
  return { module: moduleCode, grade, academicYear };
}
