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
import { useState } from "react";

export interface GradeRow {
  id: number;
  module: string;
  cwPercent: number;
  cwAvg: number;
  totalGrade: number;
  examGrade: number;
}

export const calculateExamGrades = (rows: GradeRow[]): GradeRow[] => {
  return rows.map((row) => {
    if (
      Number.isNaN(row.cwPercent) ||
      Number.isNaN(row.cwAvg) ||
      Number.isNaN(row.totalGrade)
    ) {
      return { ...row, examGrade: -1 }; // -1 means "Values required"
    }

    // check for 0s
    if (row.cwPercent === 0 || row.cwAvg === 0 || row.totalGrade === 0) {
      return { ...row, examGrade: -2 }; // -2 means "0, really???"
    }

    const cwWeight = row.cwPercent / 100;
    const exWeight = 1 - cwWeight;

    // If coursework is 100%, no exam needed
    if (exWeight <= 0) {
      return { ...row, examGrade: 0 };
    }

    const calculatedExam = (row.totalGrade - row.cwAvg * cwWeight) / exWeight;

    return {
      ...row,
      examGrade: Number((Math.round(calculatedExam * 100) / 100).toFixed(2)),
    };
  });
};

export function GradesTable() {
  const [rows, setRows] = useState<GradeRow[]>([
    {
      id: 1,
      module: "CS3102",
      cwPercent: 60,
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

  const handleCalculate = () => {
    setRows(calculateExamGrades(rows));
  };

  // Helper function to determine if an input should be red
  const isInvalid = (val: number) => Number.isNaN(val) || val === 0;

  return (
    <div className="space-y-4 py-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Module</TableHead>
            <TableHead>CW %</TableHead>
            <TableHead>CW Avg</TableHead>
            <TableHead>Total Grade</TableHead>
            <TableHead className="text-right">Exam (Calc)</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Input
                  value={row.module}
                  onChange={(e) => updateRow(row.id, "module", e.target.value)}
                  className="w-24"
                  placeholder="???"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={Number.isNaN(row.cwPercent) ? "" : row.cwPercent}
                  onChange={(e) =>
                    updateRow(
                      row.id,
                      "cwPercent",
                      e.target.value === "" ? NaN : Number(e.target.value),
                    )
                  }
                  // Check against both NaN and 0
                  className={`w-20 ${isInvalid(row.cwPercent) ? "border-destructive bg-destructive" : ""}`}
                />
              </TableCell>
              <TableCell>
                <Input
                  value={Number.isNaN(row.cwAvg) ? "" : row.cwAvg}
                  onChange={(e) =>
                    updateRow(
                      row.id,
                      "cwAvg",
                      e.target.value === "" ? NaN : Number(e.target.value),
                    )
                  }
                  className={`w-20 ${isInvalid(row.cwAvg) ? "border-destructive bg-destructive" : ""}`}
                />
              </TableCell>
              <TableCell>
                <Input
                  value={Number.isNaN(row.totalGrade) ? "" : row.totalGrade}
                  onChange={(e) =>
                    updateRow(
                      row.id,
                      "totalGrade",
                      e.target.value === "" ? NaN : Number(e.target.value),
                    )
                  }
                  className={`w-20 ${isInvalid(row.totalGrade) ? "border-destructive bg-destructive" : ""}`}
                />
              </TableCell>
              <TableCell className="text-right font-medium">
                {row.examGrade === -1 ? (
                  <span className="text-destructive text-xs">
                    Values required
                  </span>
                ) : row.examGrade === -2 ? (
                  <span className="text-destructive text-xs font-bold">
                    0, really???
                  </span>
                ) : !Number.isNaN(row.examGrade) ? (
                  <span className="text-primary">{row.examGrade}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end pt-2">
        <Button onClick={handleCalculate}>Calculate</Button>
      </div>
    </div>
  );
}
