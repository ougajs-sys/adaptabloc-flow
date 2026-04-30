import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { exportToCSV, printAsPDF, todayStamp } from "@/lib/export-utils";
import { useModules } from "@/contexts/ModulesContext";

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[];
  columns: { key: keyof T & string; label: string }[];
  filename: string;
  printTitle?: string;
  size?: "sm" | "default";
}

export function ExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  printTitle,
  size = "sm",
}: ExportButtonProps<T>) {
  const { hasModule } = useModules();
  const enabled = hasModule("export");

  const handleCSV = () => {
    if (!enabled || data.length === 0) return;
    const rows = data.map((item) => {
      const row: Record<string, string | number | null | undefined> = {};
      for (const c of columns) {
        const v = item[c.key];
        row[c.key] = v as string | number | null | undefined;
      }
      return row;
    });
    exportToCSV(`${filename}-${todayStamp()}`, rows, columns);
  };

  const handlePDF = () => {
    if (!enabled) return;
    printAsPDF(printTitle ?? filename);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={!enabled || data.length === 0}
          title={!enabled ? "Activez le module Export Excel/PDF pour utiliser cette fonction" : undefined}
          className="gap-2"
        >
          <Download size={14} />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCSV} className="gap-2">
          <FileSpreadsheet size={14} className="text-accent" />
          Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePDF} className="gap-2">
          <FileText size={14} className="text-primary" />
          PDF (impression)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
