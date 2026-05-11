// src/components/GradesTable.tsx

import { Input } from "@base-ui/react";
import { Button } from "@src/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@src/components/ui/table";
import { scrapeModuleAssessmentPattern } from "@src/scripts/scrape_percentages";
import { useEffect, useState } from "react";
import { storage } from "webextension-polyfill";

export interface GradeRow {
  id: number;
  module: string;
  academicYear?: string;
  cwAvg: number | string;
  totalGrade: number | string;
  examGrade: number;
  cwPercent?: number | string;
}

const getModuleYearKey = (module: string, academicYear?: string): string =>
  `${module.trim().toUpperCase()}::${academicYear ?? ""}`;

/**
 * returns Promise because scrapers return promises
 *
 * updates the all examGrades field in GradeRow array
 * examGrade is gonna be set to -1 if cwAvgNum or totalGradeNum are missing
 */
export const calculateExamGrades = async (
  rows: GradeRow[],
): Promise<GradeRow[]> => {
  return Promise.all(
    rows.map(async (row) => {
      const cwAvgNum =
        typeof row.cwAvg === "string"
          ? Number.parseFloat(row.cwAvg)
          : row.cwAvg;
      const totalGradeNum =
        typeof row.totalGrade === "string"
          ? Number.parseFloat(row.totalGrade)
          : row.totalGrade;

      if (Number.isNaN(cwAvgNum) || Number.isNaN(totalGradeNum)) {
        return { ...row, examGrade: -1 };
      }

      let cwPercentNum =
        typeof row.cwPercent === "string"
          ? Number.parseFloat(row.cwPercent)
          : row.cwPercent;
      if (cwPercentNum === undefined || Number.isNaN(cwPercentNum)) {
        try {
          const [_, fetchedCwPercent] = await scrapeModuleAssessmentPattern(
            row.module,
            row.academicYear,
          );
          cwPercentNum = fetchedCwPercent;
        } catch (err) {
          console.warn(
            `Could not fetch assessment pattern for ${row.module} during calculation`,
            err,
          );
        }
      }

      if (cwPercentNum === undefined || Number.isNaN(cwPercentNum)) {
        return { ...row, examGrade: -1 }; // Indicate values are required
      }

      const cwWeight = cwPercentNum / 100;
      const exWeight = 1 - cwWeight;

      if (exWeight <= 0) {
        return { ...row, examGrade: 0, cwPercent: cwPercentNum };
      }

      const calculatedExam = (totalGradeNum - cwAvgNum * cwWeight) / exWeight;

      return {
        ...row,
        examGrade: Number(calculatedExam.toFixed(2)),
        cwPercent: cwPercentNum,
      };
    }),
  );
};

export function GradesTable() {
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<GradeRow[]>([]);

  // FIXME: beeg super couple logic block. needs decoupling
  useEffect(() => {
    storage.local
      .get(["courseworkGrades", "overallModuleGrades"])
      .then(async (result) => {
        const grades = Array.isArray(result.courseworkGrades)
          ? result.courseworkGrades
          : [];
        const overallGrades = Array.isArray(result.overallModuleGrades)
          ? result.overallModuleGrades
          : [];

        // Create a lookup for overall grades by module code
        const overallGradeMap = new Map<string, number>();
        overallGrades.forEach((og: any) => {
          if (og.module && typeof og.grade === "number") {
            const academicYear =
              typeof og.academicYear === "string" ? og.academicYear : undefined;
            overallGradeMap.set(
              getModuleYearKey(og.module, academicYear),
              og.grade,
            );
            // Fallback key for older stored records without year.
            overallGradeMap.set(getModuleYearKey(og.module), og.grade);
          }
        });

        if (grades.length > 0) {
          setIsLoading(true);
          const validRows: GradeRow[] = [];
          let idCounter = 1;

          const fetchPromises = grades.map(async (g: any) => {
            const moduleCode = (g.module || "???").toUpperCase();
            const academicYear =
              typeof g.academicYear === "string" ? g.academicYear : undefined;

            let cwPercent: number | undefined = undefined;
            try {
              const [_, fetchedCwPercent] = await scrapeModuleAssessmentPattern(
                moduleCode,
                academicYear,
              );
              cwPercent = fetchedCwPercent;
            } catch (err) {
              console.warn(
                `Could not fetch assessment pattern for ${moduleCode}`,
                err,
              );
            }

            return { g, moduleCode, academicYear, cwPercent };
          });

          const results = await Promise.allSettled(fetchPromises);

          results.forEach((res, index) => {
            if (res.status === "fulfilled") {
              const { g, moduleCode, academicYear, cwPercent } = res.value;
              const overallGrade =
                overallGradeMap.get(
                  getModuleYearKey(moduleCode, academicYear),
                ) ?? overallGradeMap.get(getModuleYearKey(moduleCode));

              validRows.push({
                id: idCounter++,
                module: moduleCode,
                academicYear,
                cwAvg:
                  typeof g.grade === "number" && !Number.isNaN(g.grade)
                    ? g.grade
                    : "",
                totalGrade: overallGrade !== undefined ? overallGrade : "",
                examGrade: NaN,
                cwPercent,
              });
            } else {
              console.warn(
                `Unexpected failure for module ${grades[index].module}:`,
                res.reason,
              );
            }
          });

          console.log(validRows);
          setRows(validRows);
          setIsLoading(false);
        } else {
          setRows([]);
        }
      });
  }, []);

  const updateRow = (
    id: number,
    field: keyof GradeRow,
    value: string | number,
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const calculatedRows = await calculateExamGrades(rows);
      setRows(calculatedRows);
    } catch (error) {
      console.error("Failed to fetch assessment patterns:", error);
      alert("Check the console! Likely a CORS or Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  const isInvalid = (val: number | string) => {
    const num = typeof val === "string" ? Number.parseFloat(val) : val;
    return Number.isNaN(num) || num === 0;
  };

  const errorClasses =
    "border-red-500 bg-red-50 text-red-900 focus-visible:ring-red-500 dark:bg-red-950/50 dark:text-red-200";

  return (
    <div className="space-y-4 m-0!">
      <div className="px-8">
        <div className="sta-grades-header">
          <span className="w-24">Module</span>
          <span>CW %</span>
          <span>CW Avg</span>
          <span>Total Grade</span>
          <span className="text-right">Exam (Calc)</span>
        </div>
        <div className="sta-grades-scroll-shell">
          <div className="sta-grades-scroll max-h-70 overflow-y-auto overflow-x-hidden">
            <Table className="sta-grades-table border-none!">
              <colgroup>
                <col style={{ width: "6rem" }} />
                <col style={{ width: "5rem" }} />
                <col style={{ width: "5rem" }} />
                <col style={{ width: "5rem" }} />
                <col />
              </colgroup>
              <TableBody className="border-none!">
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-b! bg-transparent! hover:bg-transparent!"
                  >
                    <TableCell className="px-1 border-none!">
                      <Input
                        value={row.module}
                        onChange={(e) =>
                          updateRow(row.id, "module", e.target.value)
                        }
                        className="w-16 bg-background! border! border-input! rounded-md! px-3! py-1! h-9! m-0! shadow-none! text-foreground!"
                        placeholder="???"
                      />
                    </TableCell>

                    <TableCell className="px-1 border-none!">
                      <Input
                        value={row.cwPercent || ""}
                        onChange={(e) =>
                          updateRow(row.id, "cwPercent", e.target.value)
                        }
                        className="w-16 bg-background! border! border-input! rounded-md! px-3! py-1! h-9! m-0! shadow-none! text-foreground!"
                        placeholder="-"
                      />
                    </TableCell>

                    <TableCell className="px-1 border-none!">
                      <Input
                        value={row.cwAvg}
                        onChange={(e) =>
                          updateRow(row.id, "cwAvg", e.target.value)
                        }
                        className={`w-16 bg-background! border! border-input! rounded-md! px-3! py-1! h-9! m-0! shadow-none! text-foreground! ${isInvalid(row.cwAvg) ? errorClasses : ""}`}
                      />
                    </TableCell>

                    <TableCell className="px-1 border-none!">
                      <Input
                        value={row.totalGrade}
                        onChange={(e) =>
                          updateRow(row.id, "totalGrade", e.target.value)
                        }
                        placeholder="-"
                        className={`w-16 bg-background! border! border-input! rounded-md! px-3! py-1! h-9! m-0! shadow-none! text-foreground! ${isInvalid(row.totalGrade) ? errorClasses : ""}`}
                      />
                    </TableCell>

                    <TableCell className="px-1 border-none! text-right font-medium">
                      {row.examGrade === -1 ? (
                        <span className="text-destructive text-xs">
                          Values required
                        </span>
                      ) : !Number.isNaN(row.examGrade) ? (
                        <span className="text-black! font-bold">
                          {row.examGrade}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button
            onClick={handleCalculate}
            disabled={isLoading}
            className="text-white! rounded-md! px-4! py-2! h-9! shadow-none! border-none! bg-primary! hover:bg-primary/90!"
          >
            {isLoading ? "Calculating..." : "Calculate"}
          </Button>
        </div>
      </div>
    </div>
  );
}
