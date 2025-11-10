// lib/report-engine.ts
// Core report engine for data processing, grouping, and aggregation

import {
  ReportConfig,
  ReportColumn,
  ReportGrouping,
  GroupedDataNode,
} from '@/types/report';
import { format, parse } from 'date-fns';
import { it, enUS, de, fr, es, pt } from 'date-fns/locale';

const locales = { it, en: enUS, de, fr, es, pt };

/**
 * Report Engine - Main class for report data processing
 */
export class ReportEngine {
  /**
   * Apply hierarchical grouping to flat data
   */
  static applyGrouping(
    data: any[],
    grouping?: ReportGrouping[]
  ): GroupedDataNode[] | any[] {
    if (!grouping || grouping.length === 0) {
      return data;
    }

    // Sort grouping by level
    const sortedGrouping = [...grouping].sort((a, b) => a.level - b.level);

    // Recursive grouping function
    function groupByLevel(
      items: any[],
      levelIndex: number
    ): GroupedDataNode[] {
      if (levelIndex >= sortedGrouping.length) {
        return items; // No more levels, return items as-is
      }

      const currentLevel = sortedGrouping[levelIndex];
      const grouped = new Map<string, any[]>();

      // Group items by current field
      items.forEach((item) => {
        const key = String(item[currentLevel.field] ?? 'N/A');
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(item);
      });

      // Create grouped nodes
      const result: GroupedDataNode[] = [];

      grouped.forEach((groupItems, key) => {
        const node: GroupedDataNode = {
          groupKey: key,
          groupLabel: `${currentLevel.label}: ${key}`,
          level: currentLevel.level,
          collapsed: currentLevel.collapsed ?? false,
          children:
            levelIndex + 1 < sortedGrouping.length
              ? groupByLevel(groupItems, levelIndex + 1)
              : groupItems,
          aggregates: {},
        };

        result.push(node);
      });

      return result;
    }

    return groupByLevel(data, 0);
  }

  /**
   * Calculate aggregates for a set of data
   */
  static calculateAggregates(
    data: any[],
    columns: ReportColumn[]
  ): Record<string, any> {
    const aggregates: Record<string, any> = {};

    columns.forEach((col) => {
      if (!col.aggregate) return;

      const values = data
        .map((row) => row[col.field])
        .filter((val) => val !== null && val !== undefined && !isNaN(Number(val)))
        .map(Number);

      switch (col.aggregate) {
        case 'sum':
          aggregates[col.field] = values.reduce((sum, val) => sum + val, 0);
          break;

        case 'avg':
          aggregates[col.field] =
            values.length > 0
              ? values.reduce((sum, val) => sum + val, 0) / values.length
              : 0;
          break;

        case 'count':
          aggregates[col.field] = data.length;
          break;

        case 'min':
          aggregates[col.field] =
            values.length > 0 ? Math.min(...values) : 0;
          break;

        case 'max':
          aggregates[col.field] =
            values.length > 0 ? Math.max(...values) : 0;
          break;
      }
    });

    return aggregates;
  }

  /**
   * Calculate aggregates for grouped data recursively
   */
  static calculateGroupAggregates(
    groupedData: GroupedDataNode[],
    columns: ReportColumn[]
  ): void {
    groupedData.forEach((node) => {
      // If children are grouped nodes, recurse
      if (
        node.children.length > 0 &&
        'groupKey' in node.children[0]
      ) {
        this.calculateGroupAggregates(
          node.children as GroupedDataNode[],
          columns
        );

        // Calculate aggregates from child aggregates
        const flatData: any[] = [];
        (node.children as GroupedDataNode[]).forEach((child) => {
          // Collect all leaf items from children
          flatData.push(...this.flattenGroupedData([child]));
        });
        node.aggregates = this.calculateAggregates(flatData, columns);
      } else {
        // Children are leaf data items
        node.aggregates = this.calculateAggregates(node.children, columns);
      }
    });
  }

  /**
   * Flatten grouped data to get all leaf items
   */
  static flattenGroupedData(groupedData: GroupedDataNode[]): any[] {
    const result: any[] = [];

    groupedData.forEach((node) => {
      if (node.children.length > 0 && 'groupKey' in node.children[0]) {
        result.push(...this.flattenGroupedData(node.children as GroupedDataNode[]));
      } else {
        result.push(...node.children);
      }
    });

    return result;
  }

  /**
   * Get translated value from products.json multilingual structure
   * Same logic as FilterSidebar.getTranslatedValue
   */
  private static getTranslatedValue(value: any, language: string): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      return value[language] || value['it'] || Object.values(value)[0] || '';
    }
    return String(value);
  }

  /**
   * Format a value according to column type and format
   */
  static formatValue(
    value: any,
    column: ReportColumn,
    language: string = 'it'
  ): string {
    if (value === null || value === undefined) return '-';

    try {
      // If column is translatable, use getTranslatedValue for products.json translations
      // This applies to fields like "Serie", "Finitura", etc. that have {it: "...", en: "...", ...} structure
      if (column.translatable && column.type === 'string') {
        return this.getTranslatedValue(value, language);
      }

      switch (column.type) {
        case 'currency':
          return new Intl.NumberFormat(language, {
            style: 'currency',
            currency: 'EUR',
          }).format(Number(value));

        case 'date':
          // Parse date string to Date object
          let date: Date;
          if (typeof value === 'string') {
            // Try parsing YYYY-MM-DD format
            date = parse(value, 'yyyy-MM-dd', new Date());
          } else if (value instanceof Date) {
            date = value;
          } else {
            return String(value);
          }

          // Format using date-fns
          const dateFormat = column.format || 'dd/MM/yyyy';
          const locale = locales[language as keyof typeof locales] || it;
          return format(date, dateFormat, { locale });

        case 'number':
          return new Intl.NumberFormat(language).format(Number(value));

        case 'boolean':
          return value ? 'Sì' : 'No';

        default:
          return String(value);
      }
    } catch (error) {
      console.error('Error formatting value:', error);
      return String(value);
    }
  }

  /**
   * Apply filters to data
   */
  static applyFilters(
    data: any[],
    filters: Record<string, any>
  ): any[] {
    let filtered = [...data];

    Object.entries(filters).forEach(([field, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return; // Skip empty filters
      }

      const beforeCount = filtered.length;
      filtered = filtered.filter((item) => {
        const itemValue = item[field];

        if (Array.isArray(value)) {
          // Multi-select filter
          return value.includes(itemValue);
        } else if (typeof value === 'object' && value.from && value.to) {
          // Date range filter
          const itemDate = new Date(itemValue);
          const fromDate = new Date(value.from);
          const toDate = new Date(value.to);
          return itemDate >= fromDate && itemDate <= toDate;
        } else if (typeof value === 'string' && typeof itemValue === 'string') {
          // String: case-insensitive partial match (contains)
          return itemValue.toLowerCase().includes(value.toLowerCase());
        } else {
          // Other types: exact match
          return itemValue === value;
        }
      });

      const afterCount = filtered.length;
      console.log(`🔍 Filtro '${field}' = '${value}': ${beforeCount} → ${afterCount} righe`);
    });

    return filtered;
  }

  /**
   * Sort data by column and direction
   */
  static sortData(
    data: any[],
    field: string,
    direction: 'asc' | 'desc'
  ): any[] {
    return [...data].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal === bVal) return 0;

      let comparison = 0;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Process complete report: filter, sort, group, aggregate
   */
  static processReport(
    data: any[],
    config: ReportConfig,
    filters: Record<string, any> = {}
  ): { data: any[]; aggregates: Record<string, any> } {
    // 1. Apply filters
    let processed = this.applyFilters(data, filters);

    // 2. Apply sorting
    if (config.sorting) {
      processed = this.sortData(
        processed,
        config.sorting.field,
        config.sorting.direction
      );
    }

    // 3. Calculate total aggregates (before grouping)
    const totalAggregates = this.calculateAggregates(processed, config.columns);

    // 4. Apply grouping
    const grouped = this.applyGrouping(processed, config.grouping) as any;

    // 5. Calculate group aggregates if grouped
    if (config.grouping && config.grouping.length > 0 && grouped.length > 0 && 'groupKey' in grouped[0]) {
      this.calculateGroupAggregates(grouped, config.columns);
    }

    return {
      data: grouped,
      aggregates: totalAggregates,
    };
  }
}
