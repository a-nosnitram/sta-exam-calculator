/*
    scrape overall module grades from module page
    needs to run in content while user is on:
    https://mysaint.st-andrews.ac.uk/uPortal/f/my-courses/normal/render.uP (MySaint/My Courses page)
    for each module, extract the overall grade and store it in local storage
*/

export function scrapeOverallModuleGrades(
  doc: Document,
): { module: string; grade: number; academicYear: string }[] {
  const grades: { module: string; grade: number; academicYear: string }[] = [];

  const gradesPortlet = doc.querySelector("section.your-grades");
  if (!gradesPortlet) {
    console.warn("My grades portlet not found on page.");
    return grades;
  }

  const yearHeadings = gradesPortlet.querySelectorAll("h3");
  if (yearHeadings.length === 0) {
    console.warn("No academic year headings found in My grades portlet.");
    return grades;
  }

  yearHeadings.forEach((heading) => {
    const headingText = heading.textContent?.trim() ?? "";
    const yearMatch = headingText.match(/(\d{4})\s*[/\-]\s*(\d{4})/);
    if (!yearMatch) {
      console.warn("Failed to parse academic year from heading:", headingText);
      return;
    }

    // meta_ayrs_sand expects a compact format like "2025/6".
    const academicYear = `${yearMatch[1]}/${yearMatch[2].slice(-1)}`;

    const table = heading.nextElementSibling;
    if (!table || table.tagName.toLowerCase() !== "table") {
      return;
    }

    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row) => {
      const moduleCodeElement = row.querySelector("td:nth-child(2) label");
      const gradeElement = row.querySelector("td:nth-child(3)");

      if (moduleCodeElement && gradeElement) {
        const moduleCode = moduleCodeElement.textContent?.trim() ?? "";
        const gradeText = gradeElement.textContent?.trim() ?? "";
        const gradeMatch = gradeText.match(/(\d{1,3}(?:\.\d+)?)/);

        // skip rows with no published numeric grade yet (e.g. "-", "E").
        if (!gradeMatch) return;

        const grade = Number.parseFloat(gradeMatch[1]);
        grades.push({ module: moduleCode, grade, academicYear });
      }
    });
  });

  return grades;
}
