'use client';

import { ReportConfig } from '@/types/report';
import { ReportEngine } from '@/lib/report-engine';
import { FileText, Table, File } from 'lucide-react';

const TEXTS_EXPORT = {
  exportPdfTitle: {
    it: 'Esporta come PDF',
    en: 'Export as PDF',
    de: 'Als PDF exportieren',
    fr: 'Exporter en PDF',
    es: 'Exportar como PDF',
    pt: 'Exportar como PDF',
    hr: 'Exportar como PDF',
    sl: 'Exportar como PDF',
    el: 'Exportar como PDF',
  },
  exportExcelTitle: {
    it: 'Esporta come Excel',
    en: 'Export as Excel',
    de: 'Als Excel exportieren',
    fr: 'Exporter en Excel',
    es: 'Exportar como Excel',
    pt: 'Exportar como Excel',
    hr: 'Exportar como Excel',
    sl: 'Exportar como Excel',
    el: 'Exportar como Excel',
  },
  exportCsvTitle: {
    it: 'Esporta come CSV',
    en: 'Export as CSV',
    de: 'Als CSV exportieren',
    fr: 'Exporter en CSV',
    es: 'Exportar como CSV',
    pt: 'Exportar como CSV',
    hr: 'Exportar como CSV',
    sl: 'Exportar como CSV',
    el: 'Exportar como CSV',
  },
  errorCsvExport: {
    it: "Errore durante l'export CSV",
    en: 'Error during CSV export',
    de: 'Fehler beim CSV-Export',
    fr: "Erreur lors de l'export CSV",
    es: 'Error durante la exportación CSV',
    pt: 'Erro durante a exportação CSV',
    hr: 'Erro durante a exportação CSV',
    sl: 'Erro durante a exportação CSV',
    el: 'Erro durante a exportação CSV',
  },
  errorExcelExport: {
    it: "Errore durante l'export Excel",
    en: 'Error during Excel export',
    de: 'Fehler beim Excel-Export',
    fr: "Erreur lors de l'export Excel",
    es: 'Error durante la exportación Excel',
    pt: 'Erro durante a exportação Excel',
    hr: 'Erro durante a exportação Excel',
    sl: 'Erro durante a exportação Excel',
    el: 'Erro durante a exportação Excel',
  },
  noExportFormats: {
    it: 'Nessun formato di export disponibile',
    en: 'No export formats available',
    de: 'Keine Exportformate verfügbar',
    fr: "Aucun format d'export disponible",
    es: 'No hay formatos de exportación disponibles',
    pt: 'Nenhum formato de exportação disponível',
    hr: 'Nenhum formato de exportação disponível',
    sl: 'Nenhum formato de exportação disponível',
    el: 'Nenhum formato de exportação disponível',
  },
  buttonPdf: {
    it: 'PDF',
    en: 'PDF',
    de: 'PDF',
    fr: 'PDF',
    es: 'PDF',
    pt: 'PDF',
    hr: 'PDF',
    sl: 'PDF',
    el: 'PDF',
  },
  buttonExcel: {
    it: 'Excel',
    en: 'Excel',
    de: 'Excel',
    fr: 'Excel',
    es: 'Excel',
    pt: 'Excel',
    hr: 'Excel',
    sl: 'Excel',
    el: 'Excel',
  },
  buttonCsv: {
    it: 'CSV',
    en: 'CSV',
    de: 'CSV',
    fr: 'CSV',
    es: 'CSV',
    pt: 'CSV',
    hr: 'CSV',
    sl: 'CSV',
    el: 'CSV',
  },
};

function getExportColumnLabel(field: string, language: string): string {
  const key = `column_${field.replace(/`/g, '').replace(/\s+/g, '_').toLowerCase()}`;
  const colObj = (TEXTS.columns as any)[key];
  if (colObj) {
    return colObj[language] || colObj.it;
  }
  return field;
}

interface ReportExportProps {
  data: any[];
  config: ReportConfig;
  reportTitle: string;
  language?: string;
}

export default function ReportExport({ data, config, reportTitle, language = 'it' }: ReportExportProps) {
  const flattenGroupedData = (items: any[]): any[] => {
    const result: any[] = [];

    items.forEach((item) => {
      if ('groupKey' in item) {
        result.push(...flattenGroupedData(item.children));
      } else {
        result.push(item);
      }
    });

    return result;
  };

  const exportToCSV = () => {
    try {
      const flatData = flattenGroupedData(data);
      const visibleColumns = config.columns.filter((col) => col.visible);

      const headers = visibleColumns
        .map((col) => getExportColumnLabel(col.field, language))
        .join(',');

      const rows = flatData.map((row) =>
        visibleColumns
          .map((col) => {
            const value = ReportEngine.formatValue(row[col.field], col, language);
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(',')
      );

      const csv = [headers, ...rows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${reportTitle.replace(/\s+/g, '_').trim()}_${
        new Date().toISOString().split('T')[0]
      }.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert(TEXTS_EXPORT.errorCsvExport[language as keyof typeof TEXTS_EXPORT.errorCsvExport]);
    }
  };

  const exportToExcel = () => {
    try {
      const flatData = flattenGroupedData(data);
      const visibleColumns = config.columns.filter((col) => col.visible);

      let html = '<table border="1"><thead><tr>';

      visibleColumns.forEach((col) => {
        html += `<th>${getExportColumnLabel(col.field, language)}</th>`;
      });
      html += '</tr></thead><tbody>';

      flatData.forEach((row) => {
        html += '<tr>';
        visibleColumns.forEach((col) => {
          const value = ReportEngine.formatValue(row[col.field], col, language);
          html += `<td>${value}</td>`;
        });
        html += '</tr>';
      });

      html += '</tbody></table>';

      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${reportTitle.replace(/\s+/g, '_').trim()}_${
        new Date().toISOString().split('T')[0]
      }.xls`;
      link.click();
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert(TEXTS_EXPORT.errorExcelExport[language as keyof typeof TEXTS_EXPORT.errorExcelExport]);
    }
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {config.export?.pdf && (
        <button
          onClick={exportToPDF}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 text-sm font-medium shadow-sm"
          title={TEXTS_EXPORT.exportPdfTitle[language as keyof typeof TEXTS_EXPORT.exportPdfTitle]}
        >
          <FileText className="w-4 h-4" />
          {TEXTS_EXPORT.buttonPdf[language as keyof typeof TEXTS_EXPORT.buttonPdf]}
        </button>
      )}

      {config.export?.excel && (
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 text-sm font-medium shadow-sm"
          title={
            TEXTS_EXPORT.exportExcelTitle[language as keyof typeof TEXTS_EXPORT.exportExcelTitle]
          }
        >
          <Table className="w-4 h-4" />
          {TEXTS_EXPORT.buttonExcel[language as keyof typeof TEXTS_EXPORT.buttonExcel]}
        </button>
      )}

      {config.export?.csv && (
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2 text-sm font-medium shadow-sm"
          title={TEXTS_EXPORT.exportCsvTitle[language as keyof typeof TEXTS_EXPORT.exportCsvTitle]}
        >
          <File className="w-4 h-4" />
          {TEXTS_EXPORT.buttonCsv[language as keyof typeof TEXTS_EXPORT.buttonCsv]}
        </button>
      )}

      {!config.export?.pdf && !config.export?.excel && !config.export?.csv && (
        <p className="text-sm text-gray-500">
          {TEXTS_EXPORT.noExportFormats[language as keyof typeof TEXTS_EXPORT.noExportFormats]}
        </p>
      )}
    </div>
  );
}