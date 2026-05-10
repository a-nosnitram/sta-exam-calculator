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

import { JSDOM } from "jsdom";
import { a } from "node_modules/vite/dist/node/moduleRunnerTransport.d-DJ_mE5sf";

async function fetchCourseworkPage(url: string): Promise<Document> {
  const resp = await fetch(url, { credentials: "include" });
  const html = await resp.text();
  const dom = new JSDOM(html);
  const document = dom.window.document;

  return document;
}

async function scarpeCourseworkLinks(): Promise<string[]> {
  const url =
    "https://mysaint.st-andrews.ac.uk/uPortal/f/my-courses/normal/render.uP";
  const document = await fetchCourseworkPage(url);

  const courseworkLinks = Array.from(
    document.querySelectorAll('a.list-group-item[data-type="coursework"]'),
  ).map((a) => (a as HTMLAnchorElement).href);

  return courseworkLinks;
}

export async function scrapeCourseworkGrade(
  url: string,
): Promise<number | null> {
  const document = await fetchCourseworkPage(url);

  return 0;
}
