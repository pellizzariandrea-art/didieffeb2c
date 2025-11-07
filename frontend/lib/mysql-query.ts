// lib/mysql-query.ts
// Helper for executing MySQL queries via PHP backend

import { QueryResult } from '@/types/report';

/**
 * Execute a predefined query from query-config.json
 * @param querySlug - The query identifier (e.g., 'customer_documents')
 * @param params - Query parameters (will be validated by backend)
 * @returns Query result with data array
 */
export async function executeQuery(
  querySlug: string,
  params: Record<string, any>
): Promise<QueryResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';

  const response = await fetch(`${apiUrl}/admin/api/execute-query.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: querySlug,
      params,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Query failed with status ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Query execution failed');
  }

  return result;
}

/**
 * Get list of document types for a client (for filter dropdowns)
 */
export async function getDocumentTypes(clientCode: string): Promise<string[]> {
  const result = await executeQuery('document_types_list', { clientCode });
  return result.data?.map((row: any) => row.tipo_documento) || [];
}

/**
 * Get list of years with documents (for filter dropdowns)
 */
export async function getDocumentYears(clientCode: string): Promise<number[]> {
  const result = await executeQuery('document_years_list', { clientCode });
  return result.data?.map((row: any) => parseInt(row.anno)) || [];
}

/**
 * Get total document count for a client
 */
export async function getDocumentCount(clientCode: string): Promise<number> {
  const result = await executeQuery('document_count', { clientCode });
  return result.data?.[0]?.total || 0;
}
