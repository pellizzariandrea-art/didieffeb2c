// types/report.ts
// Type definitions for Report Builder System

export type ReportColumnType = 'string' | 'number' | 'currency' | 'date' | 'boolean';
export type ReportAggregateFunction = 'sum' | 'avg' | 'count' | 'min' | 'max';
export type FilterType = 'text' | 'select' | 'multiselect' | 'daterange' | 'numberrange';
export type SortDirection = 'asc' | 'desc';

/**
 * Column definition for a report
 */
export interface ReportColumn {
  field: string;                    // Nome campo dal DB (es. 'totale', 'data')
  label: string;                    // Label visualizzata (es. 'Importo', 'Data Documento')
  type: ReportColumnType;           // Tipo di dato per formattazione
  format?: string;                  // Pattern di formato (es. '€ #,##0.00', 'DD/MM/YYYY')
  visible: boolean;                 // Se la colonna è visibile o nascosta
  aggregate?: ReportAggregateFunction; // Funzione di aggregazione per totali
  width?: number;                   // Larghezza colonna in pixel
  align?: 'left' | 'center' | 'right'; // Allineamento testo
}

/**
 * Grouping level definition
 */
export interface ReportGrouping {
  field: string;                    // Campo su cui raggruppare (es. 'anno', 'tipo_documento')
  label: string;                    // Label del gruppo (es. 'Anno', 'Tipo Documento')
  level: number;                    // Livello gerarchico (1 = primo livello, 2 = secondo, etc.)
  showTotals: boolean;              // Se mostrare subtotali per questo livello
  collapsed?: boolean;              // Se il gruppo inizia collassato
}

/**
 * Filter definition for report
 */
export interface ReportFilter {
  field: string;                    // Campo da filtrare
  label: string;                    // Label del filtro
  type: FilterType;                 // Tipo di filtro UI
  options?: string[] | 'auto';      // Opzioni per select/multiselect ('auto' = carica da query)
  default?: any;                    // Valore default
}

/**
 * Sorting configuration
 */
export interface ReportSorting {
  field: string;                    // Campo su cui ordinare
  direction: SortDirection;         // Direzione ordinamento
}

/**
 * Export options
 */
export interface ReportExportOptions {
  pdf?: boolean;                    // Abilita export PDF
  excel?: boolean;                  // Abilita export Excel
  csv?: boolean;                    // Abilita export CSV
}

/**
 * Complete report configuration
 */
export interface ReportConfig {
  title: string;                    // Titolo del report
  description?: string;             // Descrizione opzionale
  query: string;                    // Slug della query da eseguire (da query-config.json)
  columns: ReportColumn[];          // Definizione colonne
  grouping?: ReportGrouping[];      // Livelli di raggruppamento
  filters?: ReportFilter[];         // Filtri disponibili
  sorting?: ReportSorting;          // Ordinamento default
  export?: ReportExportOptions;     // Opzioni export
}

/**
 * Filter values submitted by user
 */
export interface ReportFilterValues {
  [key: string]: any;
}

/**
 * Grouped data structure for rendering
 */
export interface GroupedDataNode {
  groupKey: string;                 // Chiave del gruppo (valore del campo)
  groupLabel: string;               // Label visualizzata
  level: number;                    // Livello di profondità
  children: (GroupedDataNode | any)[]; // Sottogruppi o righe dati
  aggregates?: Record<string, any>; // Valori aggregati per questo gruppo
  collapsed?: boolean;              // Stato collapsed/expanded
}

/**
 * Query parameter definition (for MySQL query execution)
 */
export interface QueryParam {
  type: 'string' | 'int' | 'float' | 'date' | 'boolean';
  required: boolean;
  default?: any;
}

/**
 * Query configuration (MySQL queries)
 */
export interface QueryConfig {
  description: string;
  sql: string;                      // Query SQL con named parameters (:paramName)
  params: Record<string, QueryParam>; // Definizione parametri
}

/**
 * Query execution result
 */
export interface QueryResult {
  success: boolean;
  query?: string;
  data?: any[];
  count?: number;
  error?: string;
}
