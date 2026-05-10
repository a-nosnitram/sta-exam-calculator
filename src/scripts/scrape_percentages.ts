// scrape https://www.st-andrews.ac.uk/subjects/modules/catalogue/?meta_modulecode=AH1001 given a module code
// find the "Assessment pattern" (<h2>Assessment pattern</h2>) section, extract the content

function extractPercentageByLabel(
  text: string,
  labelPattern: string,
): number | null {
  const patterns = [
    new RegExp(
      `${labelPattern}\\s*[:=\\-]?\\s*\\(?\\s*(\\d{1,3})\\s*%\\s*\\)?`,
      "i",
    ),
    new RegExp(`\\(?\\s*(\\d{1,3})\\s*%\\s*\\)?\\s*${labelPattern}`, "i"),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }

    const percentage = Number.parseInt(match[1], 10);
    if (Number.isFinite(percentage)) {
      return percentage;
    }
  }

  return null;
}

// return a tuple of the form [exam, coursework] like [80, 20] for 80% exam and 20% coursework
export async function scrapeModuleAssessmentPattern(
  moduleCode: string,
): Promise<[number, number]> {
  const targetUrl = `https://www.st-andrews.ac.uk/subjects/modules/catalogue/?meta_modulecode=${moduleCode}`;
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

  const resp = await fetch(proxyUrl);

  if (!resp.ok) throw new Error("Failed to fetch module data");

  const html = await resp.text();

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");

  const assessmentPatternHeading = Array.from(
    document.querySelectorAll("h2"),
  ).find((h) => h.textContent?.trim() === "Assessment pattern");

  // assessment header is an h2, then there is
  // a div with class 'alternate-rows'
  // then each row is a div with class 'row'
  // each row has a div 'col-sm-6'
  // we need to extract the p from the first row's col-sm-6

  if (!assessmentPatternHeading) {
    throw new Error(
      `Could not find assessment pattern heading for module ${moduleCode}`,
    );
  }
  const assessmentPatternContent = assessmentPatternHeading.nextElementSibling;

  if (
    !assessmentPatternContent ||
    !assessmentPatternContent.classList.contains("alternate-rows")
  ) {
    throw new Error(
      `Could not find assessment pattern content for module ${moduleCode}`,
    );
  }

  // extract the assessment percentages from the first row's col-sm-6
  const firstRow = assessmentPatternContent.querySelector(".row");
  const firstCol = firstRow?.querySelector(".col-sm-6");
  if (!firstCol) {
    throw new Error(`Could not find first column for module ${moduleCode}`);
  }
  const assessmentText = firstCol.textContent?.trim() || "";
  console.log(`Assessment text for module ${moduleCode}: ${assessmentText}`);

  // normalise whitespace in the assessment text
  const normalizedAssessmentText = assessmentText.replace(/\s+/g, " ").trim();
  const examPercentage =
    extractPercentageByLabel(normalizedAssessmentText, "exam(?:ination)?") ?? 0;
  const courseworkPercentage =
    extractPercentageByLabel(normalizedAssessmentText, "coursework") ?? 0;

  console.log(`Exam percentage for module ${moduleCode}: ${examPercentage}`);
  console.log(
    `Coursework percentage for module ${moduleCode}: ${courseworkPercentage}`,
  );

  return [examPercentage, courseworkPercentage];
}
