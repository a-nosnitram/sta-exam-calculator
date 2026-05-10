/*
    scrape coursework grades from module page
    needs to fetch in the background while user is on
    user is on: https://mysaint.st-andrews.ac.uk/uPortal/f/my-courses/normal/render.uP that
    page contains a list of modules, in a
        <a  class="list-group-item"
            data-type="coursework"
            href="https://mms.st-andrews.ac.uk/mms/module/2025_6/S2/CS3052/CS3052+Coursework/">
            <span class="searchable" data-matches-filter="false">CS3052 Coursework</span>
        </a>
    then we fetch "https://mms.st-andrews.ac.uk/mms/module/2025_6/S2/&{module}/&{module}+Coursework/"
    for each module, extract the coursework grade and store it in local storage
*/

// content script for when user is on https://mysaint.st-andrews.ac.uk/uPortal/f/my-courses/normal/render.uP
export function scrapeCourseworkLinksFromMySaint(doc: Document): string[] {
  return Array.from(
    doc.querySelectorAll('a.list-group-item[data-type="coursework"]'),
  )
    .map((a) => (a as HTMLAnchorElement).href)
    .filter((href) => href.includes("mms.st-andrews.ac.uk/mms/module/"));
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
    /Running\s*average\s*(?::|=)?\s*(\d{1,3}(?:\.\d+)?)/i,
  );
  if (!match) {
    throw new Error("Failed to parse coursework grade from text");
  }
  return match ? Number.parseFloat(match[1]) : 0;
}

export async function scrapeCourseworkGrade(
  url: string,
): Promise<number | null> {
  const html = await fetchCourseworkPage(url);
  return parseCourseworkGradeFromText(html);
}
