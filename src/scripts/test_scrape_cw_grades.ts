import { readFile } from "node:fs/promises";
import {
  parseCourseworkGradeFromText,
  scrapeCourseworkGrade,
} from "./scrape_cw_grades";

function printUsage() {
  console.log("Usage:");
  console.log("  bun run test:scrape-cw");
  console.log("  bun run test:scrape-cw --sample \"Running average: 16.5\"");
  console.log("  bun run test:scrape-cw --file ./path/to/coursework-page.html");
  console.log(
    "  bun run test:scrape-cw --url https://mms.st-andrews.ac.uk/mms/module/...",
  );
}

async function main() {
  const [flag, value] = process.argv.slice(2);

  if (!flag) {
    const sample = "Running average: 16.5";
    const grade = parseCourseworkGradeFromText(sample);
    console.log({ source: "default sample", grade });
    return;
  }

  if (flag === "--sample") {
    if (!value) {
      throw new Error("Missing sample text.");
    }
    const grade = parseCourseworkGradeFromText(value);
    console.log({ source: "sample", grade });
    return;
  }

  if (flag === "--file") {
    if (!value) {
      throw new Error("Missing file path.");
    }
    const html = await readFile(value, "utf8");
    const grade = parseCourseworkGradeFromText(html);
    console.log({ source: value, grade });
    return;
  }

  if (flag === "--url") {
    if (!value) {
      throw new Error("Missing URL.");
    }
    const grade = await scrapeCourseworkGrade(value);
    console.log({ source: value, grade });
    return;
  }

  printUsage();
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
