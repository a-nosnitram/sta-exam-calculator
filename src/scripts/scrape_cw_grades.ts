/*
    scrape coursework grades from module page
    needs to fetch in the background while user is on
    user is on: https://mysaint.st-andrews.ac.uk/uPortal/f/my-courses/normal/render.uP (MySaint/My Courses page)
    then we fetch "https://mms.st-andrews.ac.uk/mms/module/{year}/{semester}/&{module}/&{module}+Coursework/"
    for each module, extract the coursework grade and store it in local storage
*/

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

      return isModuleLink && !isQuizLink && !isQuizLabel && !isStacsCheckLink;
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
    /running\s*average:\s*(?::|=)?\s*(\d{1,3}(?:\.\d+)?)/i,
  );
  if (!match) {
    // console.error("Failed to parse coursework grade from text:", text);
    throw new Error("Failed to parse coursework grade from text", {
      cause: text,
    });
  }
  return match ? Number.parseFloat(match[1]) : 0;
}

export async function scrapeCourseworkGrade(
  url: string,
): Promise<number | null> {
  const html = await fetchCourseworkPage(url);
  return parseCourseworkGradeFromText(html);
}
