/*
    scrape overall module grades from module page
    needs to run in content while user is on:
    https://mysaint.st-andrews.ac.uk/uPortal/f/my-courses/normal/render.uP (MySaint/My Courses page)
    for each module, extract the overall grade and store it in local storage
*/

export function scrapeOverallModuleGrades(
  doc: Document,
): { module: string; grade: number }[] {
  const grades: { module: string; grade: number }[] = [];

  const gradesPortlet = doc.querySelector("section.your-grades");
  if (!gradesPortlet) {
    console.warn("My grades portlet not found on page.");
    return grades;
  }

  const rows = gradesPortlet.querySelectorAll(
    "table.table-bordered.table-striped tbody tr",
  );
  if (rows.length === 0) {
    console.warn("No module-grade rows found in My grades portlet yet.");
  }
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
      grades.push({ module: moduleCode, grade });
    }
  });

  return grades;
}
