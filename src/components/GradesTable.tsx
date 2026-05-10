// src/components/GradesTable.tsx

import { Button } from "@src/components/ui/button";
import { Input } from "@src/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@src/components/ui/table";
import { scrapeModuleAssessmentPattern } from "@src/scripts/scrape_percentages";
import { useState } from "react";

export interface GradeRow {
  id: number;
  module: string;
  cwAvg: number;
  totalGrade: number;
  examGrade: number;
}

// Update the signature to be async and return a Promise
export const calculateExamGrades = async (
  rows: GradeRow[],
): Promise<GradeRow[]> => {
  return Promise.all(
    rows.map(async (row) => {
      if (Number.isNaN(row.cwAvg) || Number.isNaN(row.totalGrade)) {
        return { ...row, examGrade: -1 };
      }

      const [_, cwPercent] = await scrapeModuleAssessmentPattern(row.module);

      const cwWeight = cwPercent / 100;
      const exWeight = 1 - cwWeight;

      if (exWeight <= 0) {
        return { ...row, examGrade: 0 };
      }

      const calculatedExam = (row.totalGrade - row.cwAvg * cwWeight) / exWeight;

      return {
        ...row,
        examGrade: Number((Math.round(calculatedExam * 100) / 100).toFixed(2)),
      };
    }),
  );
};

export function GradesTable() {
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<GradeRow[]>([
    {
      id: 1,
      module: "CS3102",
      cwAvg: 16,
      totalGrade: 17,
      examGrade: NaN,
    },
    {
      id: 2,
      module: "CS3102",
      cwAvg: 16,
      totalGrade: 17,
      examGrade: NaN,
    },
    {
      id: 3,
      module: "CS3102",
      cwAvg: 16,
      totalGrade: 17,
      examGrade: NaN,
    },
  ]);

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

  const isInvalid = (val: number) => Number.isNaN(val) || val === 0;

  const errorClasses =
    "border-red-500 bg-red-50 text-red-900 focus-visible:ring-red-500 dark:bg-red-950/50 dark:text-red-200";

  return (
    <div className="space-y-4 py-4 m-0!">
      <Table className="m-0! border-none!">
        <TableHeader className="bg-transparent!">
          <TableRow className="border-b! border-border! bg-transparent! hover:bg-transparent!">
            <TableHead className="bg-transparent! text-primary-foreground! font-medium! p-2! border-none!">
              Module
            </TableHead>
            <TableHead className="bg-transparent! text-primary-foreground! font-medium! p-2! border-none!">
              CW Avg
            </TableHead>
            <TableHead className="bg-transparent! text-primary-foreground! font-medium! p-2! border-none!">
              Total Grade
            </TableHead>
            <TableHead className="bg-transparent! text-primary-foreground! font-medium! p-2! border-none! text-right whitespace-nowrap">
              Exam (Calc)
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="border-none!">
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className="border-b! border-border! bg-transparent! hover:bg-transparent!"
            >
              <TableCell className="pr-2! border-none!">
                <Input
                  value={row.module}
                  onChange={(e) => updateRow(row.id, "module", e.target.value)}
                  className="w-24 bg-background! border! border-input! rounded-md! px-3! py-1! h-9! m-0! shadow-none! text-foreground!"
                  placeholder="???"
                />
              </TableCell>
              <TableCell className="pr-2! border-none!">
                <Input
                  value={Number.isNaN(row.cwAvg) ? "" : row.cwAvg}
                  onChange={(e) =>
                    updateRow(
                      row.id,
                      "cwAvg",
                      e.target.value === "" ? NaN : Number(e.target.value),
                    )
                  }
                  className={`w-20 bg-background! border! border-input! rounded-md! px-3! py-1! h-9! m-0! shadow-none! text-foreground! ${isInvalid(row.cwAvg) ? errorClasses : ""}`}
                />
              </TableCell>
              <TableCell className="pr-2! border-none!">
                <Input
                  value={Number.isNaN(row.totalGrade) ? "" : row.totalGrade}
                  onChange={(e) =>
                    updateRow(
                      row.id,
                      "totalGrade",
                      e.target.value === "" ? NaN : Number(e.target.value),
                    )
                  }
                  className={`w-20 bg-background! border! border-input! rounded-md! px-3! py-1! h-9! m-0! shadow-none! text-foreground! ${isInvalid(row.totalGrade) ? errorClasses : ""}`}
                />
              </TableCell>
              <TableCell className="pr-2! border-none! text-right font-medium">
                {row.examGrade === -1 ? (
                  <span className="text-destructive text-xs">
                    Values required
                  </span>
                ) : !Number.isNaN(row.examGrade) ? (
                  <span className="text-black! font-bold">{row.examGrade}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleCalculate}
          disabled={isLoading}
          className="text-white! rounded-md! px-4! py-2! h-9! shadow-none! border-none! bg-primary! hover:bg-primary/90!"
        >
          {isLoading ? "Calculating..." : "Calculate"}
        </Button>
      </div>
    </div>
  );
}
