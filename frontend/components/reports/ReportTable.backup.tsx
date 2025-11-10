'use client';

import { useState, useEffect } from 'react';
import { ReportColumn, GroupedDataNode } from '@/types/report';
import { ReportEngine } from '@/lib/report-engine';
import { ChevronDown, ChevronRight } from 'lucide-react';

const TEXTS = {
  // ----------------------------------------------------------
  // Bottoni / messaggi di sistema
  // ----------------------------------------------------------
  buttonShowOnlyPending: {
    it: 'Mostra solo da consegnare',
    en: 'Show only pending',
    de: 'Nur ausstehende anzeigen',
    fr: 'Afficher uniquement en attente',
    es: 'Mostrar solo pendientes',
    pt: 'Mostrar apenas pendentes',
  },
  buttonExcel: {
    it: 'Excel',
    en: 'Excel',
    de: 'Excel',
    fr: 'Excel',
    es: 'Excel',
    pt: 'Excel',
  },
  buttonPDF: {
    it: 'PDF',
    en: 'PDF',
    de: 'PDF',
    fr: 'PDF',
    es: 'PDF',
    pt: 'PDF',
  },
  messageNoDocuments: {
    it: 'Nessun documento trovato',
    en: 'No documents found',
    de: 'Keine Dokumente gefunden',
    fr: 'Aucun document trouvé',
    es: 'No se encontraron documentos',
    pt: 'Nenhum documento encontrado',
  },
  labelTotal: {
    it: 'TOTALE',
    en: 'TOTAL',
    de: 'GESAMT',
    fr: 'TOTAL',
    es: 'TOTAL',
    pt: 'TOTAL',
  },

  // ----------------------------------------------------------
  // Stato righe
  // ----------------------------------------------------------
  statusDelivered: {
    it: 'CONSEGNATO',
    en: 'DELIVERED',
    de: 'GELIEFERT',
    fr: 'LIVRÉ',
    es: 'ENTREGADO',
    pt: 'ENTREGUE',
  },
  statusInOrder: {
    it: 'IN ORDINE',
    en: 'IN ORDER',
    de: 'IN AUFTRAG',
    fr: 'EN COMMANDE',
    es: 'EN PEDIDO',
    pt: 'EM PEDIDO',
  },

  // ----------------------------------------------------------
  // Raggruppamenti
  // ----------------------------------------------------------
  labelOrder: {
    it: 'Ordine',
    en: 'Order',
    de: 'Bestellung',
    fr: 'Commande',
    es: 'Pedido',
    pt: 'Pedido',
  },
  labelDelivered: {
    it: 'consegnato',
    en: 'delivered',
    de: 'geliefert',
    fr: 'livré',
    es: 'entregado',
    pt: 'entregue',
  },
  labelFulfilled: {
    it: 'Evasi',
    en: 'Fulfilled',
    de: 'Erfüllt',
    fr: 'Traités',
    es: 'Cumplidos',
    pt: 'Cumpridos',
  },

  // ----------------------------------------------------------
  // COLONNE DINAMICHE
  // Ogni colonna usa: column_<nomeField>
  // ----------------------------------------------------------
  columns: {
    column_data: {
      it: 'Data',
      en: 'Date',
      de: 'Datum',
      fr: 'Date',
      es: 'Fecha',
      pt: 'Data',
    },
    column_tipo_documento: {
      it: 'Tipo Documento',
      en: 'Document type',
      de: 'Belegart',
      fr: 'Type de document',
      es: 'Tipo de documento',
      pt: 'Tipo de documento',
    },
    column_tipo: {
      it: 'Tipo',
      en: 'Type',
      de: 'Typ',
      fr: 'Type',
      es: 'Tipo',
      pt: 'Tipo',
    },
    column_numero: {
      it: 'Numero',
      en: 'Number',
      de: 'Nummer',
      fr: 'Numéro',
      es: 'Número',
      pt: 'Número',
    },
    column_descrizione: {
      it: 'Descrizione',
      en: 'Description',
      de: 'Beschreibung',
      fr: 'Description',
      es: 'Descripción',
      pt: 'Descrição',
    },
    column_stato: {
      it: 'Stato',
      en: 'Status',
      de: 'Status',
      fr: 'Statut',
      es: 'Estado',
      pt: 'Estado',
    },
    column_totale: {
      it: 'Importo',
      en: 'Amount',
      de: 'Betrag',
      fr: 'Montant',
      es: 'Importe',
      pt: 'Valor',
    },
    column_valuta: {
      it: 'Valuta',
      en: 'Currency',
      de: 'Währung',
      fr: 'Devise',
      es: 'Moneda',
      pt: 'Moeda',
    },
    column_anno: {
      it: 'Anno',
      en: 'Year',
      de: 'Jahr',
      fr: 'Année',
      es: 'Año',
      pt: 'Ano',
    },
    column_ngl_doc_ord: {
      it: 'Numero Ordine',
      en: 'Order number',
      de: 'Bestellnummer',
      fr: 'Numéro de commande',
      es: 'Número de pedido',
      pt: 'Número do pedido',
    },
    column_dtt_ord: {
      it: 'Data Ordine',
      en: 'Order date',
      de: 'Bestelldatum',
      fr: 'Date de commande',
      es: 'Fecha de pedido',
      pt: 'Data do pedido',
    },
    column_cds_caum: {
      it: 'Causale',
      en: 'Reason',
      de: 'Grund',
      fr: 'Motif',
      es: 'Causal',
      pt: 'Causa',
    },
    column_cky_cnt_clfr: {
      it: 'Codice cliente',
      en: 'Customer code',
      de: 'Kundencode',
      fr: 'Code client',
      es: 'Código cliente',
      pt: 'Código do cliente',
    },
    column_cds_cnt_ragsoc: {
      it: 'Ragione Sociale',
      en: 'Company name',
      de: 'Firmenname',
      fr: 'Raison sociale',
      es: 'Razón social',
      pt: 'Razão social',
    },
    column_nome_agente: {
      it: 'Agente',
      en: 'Agent',
      de: 'Vertreter',
      fr: 'Agent',
      es: 'Agente',
      pt: 'Agente',
    },
    column_cky_art: {
      it: 'Codice Articolo',
      en: 'Item code',
      de: 'Artikelcode',
      fr: "Code de l'article",
      es: 'Código artículo',
      pt: 'Código do artigo',
    },
    column_descrizione_art: {
      it: 'Articolo',
      en: 'Item',
      de: 'Artikel',
      fr: 'Article',
      es: 'Artículo',
      pt: 'Artigo',
    },
    column_quantita: {
      it: 'Quantità',
      en: 'Quantity',
      de: 'Menge',
      fr: 'Quantité',
      es: 'Cantidad',
      pt: 'Quantidade',
    },
    column_valore: {
      it: 'Valore',
      en: 'Value',
      de: 'Wert',
      fr: 'Valeur',
      es: 'Valor',
      pt: 'Valor',
    },
    column_sigla_trasf: {
      it: 'Sigla Doc Magazzino',
      en: 'Warehouse doc code',
      de: 'Lagerbeleg-Kürzel',
      fr: 'Code doc magasin',
      es: 'Sigla doc almacén',
      pt: 'Sigla doc armazém',
    },
    column_numero_trasf: {
      it: 'Numero Doc Magazzino',
      en: 'Warehouse doc number',
      de: 'Lagerbelegnummer',
      fr: 'Numéro doc magasin',
      es: 'Número doc almacén',
      pt: 'Número doc armazém',
    },
    column_data_trasf: {
      it: 'Data trasf',
      en: 'Transfer date',
      de: 'Transferdatum',
      fr: 'Date transfert',
      es: 'Fecha transf',
      pt: 'Data transf',
    },
    column_origne: {
      it: 'Evaso o In Ordine',
      en: 'Fulfilled or On order',
      de: 'Erledigt oder in Bestellung',
      fr: 'Livré ou en commande',
      es: 'Servido o en pedido',
      pt: 'Atendido ou em pedido',
    },
    column_sco_1: {
      it: 'Sco 1',
      en: 'Disc 1',
      de: 'Rabatt 1',
      fr: 'Rem 1',
      es: 'Dto 1',
      pt: 'Desc 1',
    },
    column_sco_2: {
      it: 'Sco 2',
      en: 'Disc 2',
      de: 'Rabatt 2',
      fr: 'Rem 2',
      es: 'Dto 2',
      pt: 'Desc 2',
    },
    column_sco_3: {
      it: 'Sco 3',
      en: 'Disc 3',
      de: 'Rabatt 3',
      fr: 'Rem 3',
      es: 'Dto 3',
      pt: 'Desc 3',
    },
    column_npz_unit: {
      it: 'Prezzo Unitario',
      en: 'Unit price',
      de: 'Einzelpreis',
      fr: 'Prix unitaire',
      es: 'Precio unitario',
      pt: 'Preço unitário',
    },
  },
};

function getColumnLabelFromField(field: string | undefined, language: string): string {
  if (!field) return '';
  const key = `column_${field.replace(/`/g, '').replace(/\s+/g, '_').toLowerCase()}`;
  const colObj = (TEXTS.columns as any)[key];
  if (colObj) {
    return colObj[language] || colObj.it;
  }
  return field;
}

interface ReportTableProps {
  data: any[] | GroupedDataNode[];
  columns: ReportColumn[];
  aggregates?: Record<string, any>;
  language?: string;
  isGrouped?: boolean;
  groupingConfig?: any[];
}

export default function ReportTable({
  data,
  columns,
  aggregates,
  language = 'it',
  isGrouped = false,
  groupingConfig = [],
}: ReportTableProps) {
  // inizializzazione gruppi
  const getInitialExpandedGroups = () => {
    const shouldExpandAll =
      groupingConfig.length > 0 && groupingConfig[0].collapsed === false;

    if (shouldExpandAll && isGrouped && data.length > 0) {
      const all = new Set<string>();
      const collect = (nodes: any[]) => {
        nodes.forEach((n) => {
          if ('groupKey' in n) {
            all.add(n.groupKey);
            if (n.children?.length) collect(n.children);
          }
        });
      };
      collect(data as GroupedDataNode[]);
      return all;
    }
    return new Set<string>();
  };

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    getInitialExpandedGroups()
  );
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const visibleColumns = columns.filter((c) => c.visible);

  const statusColumn = columns.find((c) =>
    (c.field || '').toLowerCase().includes('stato')
  );

  useEffect(() => {
    setExpandedGroups(getInitialExpandedGroups());
  }, [data, groupingConfig]);

  // calcolo larghezze basato su label tradotta
  useEffect(() => {
    const widths: Record<string, number> = {};
    const sampleRows: any[] = Array.isArray(data)
      ? data.filter((r) => !('groupKey' in r)).slice(0, 10)
      : [];

    visibleColumns.forEach((col) => {
      const label = getColumnLabelFromField(col.field, language);
      let maxLen = (label || col.field || '').length;

      sampleRows.forEach((row) => {
        const val = row[col.field];
        const str = val == null ? '' : String(val);
        if (str.length > maxLen) maxLen = str.length;
      });

      let px = maxLen * 8 + 28;
      const isTexty =
        label.toLowerCase().includes('descr') ||
        label.toLowerCase().includes('articolo');
      const min = isTexty ? 160 : 90;
      const max = isTexty ? 360 : 180;
      if (px < min) px = min;
      if (px > max) px = max;

      widths[col.field] = px;
    });

    setColumnWidths(widths);
  }, [data, columns, language, visibleColumns]);

  const toggleGroup = (groupKey: string) => {
    const next = new Set(expandedGroups);
    if (next.has(groupKey)) next.delete(groupKey);
    else next.add(groupKey);
    setExpandedGroups(next);
  };

  const getGroupDeliveryInfo = (node: GroupedDataNode) => {
    let total = 0;
    let delivered = 0;

    const scan = (items: any[]) => {
      items.forEach((it) => {
        if ('groupKey' in it) {
          if (it.children?.length) scan(it.children);
        } else {
          total++;
          if (statusColumn) {
            const raw = (it[statusColumn.field] || '').toString().trim().toUpperCase();
            if (raw === 'EVASO' || raw === 'CONSEGNATO') delivered++;
          }
        }
      });
    };

    if (node.children?.length) scan(node.children);

    const perc = total > 0 ? Math.round((delivered / total) * 100) : 0;
    return { total, delivered, perc };
  };

  // filtro "mostra solo da consegnare"
  const filteredData = (() => {
    if (!showOnlyPending) return data;
    if (isGrouped && Array.isArray(data) && data.length > 0 && 'groupKey' in data[0]) {
      return (data as GroupedDataNode[]).filter((node) => {
        const { perc } = getGroupDeliveryInfo(node);
        return perc < 100;
      });
    }
    if (Array.isArray(data)) {
      return data.filter((row: any) => {
        if (!statusColumn) return true;
        const raw = (row[statusColumn.field] || '').toString().trim().toUpperCase();
        return !(raw === 'EVASO' || raw === 'CONSEGNATO');
      });
    }
    return data;
  })();

  const renderStatusBadge = (raw: any) => {
    const txt = (raw || '').toString().trim().toUpperCase();
    const delivered = txt === 'EVASO' || txt === 'CONSEGNATO';
    return (
      <span
        className={`inline-flex items-center px-2 py-[2px] rounded-full text-[11px] font-semibold ${
          delivered
            ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
            : 'bg-sky-100 text-sky-700 ring-1 ring-sky-200'
        }`}
      >
        {delivered
          ? TEXTS.statusDelivered[language as keyof typeof TEXTS.statusDelivered]
          : TEXTS.statusInOrder[language as keyof typeof TEXTS.statusInOrder]}
      </span>
    );
  };

  const renderDataRow = (row: any, idx: number) => {
    return (
      <div
        key={idx}
        className="flex border-b border-slate-100 hover:bg-slate-50/80 transition-colors duration-150"
      >
        {visibleColumns.map((col) => {
          const width = columnWidths[col.field] || 120;
          if (statusColumn && col.field === statusColumn.field) {
            return (
              <div
                key={col.field}
                className="px-3 py-2 flex items-center"
                style={{ width, minWidth: width }}
              >
                {renderStatusBadge(row[col.field])}
              </div>
            );
          }
          return (
            <div
              key={col.field}
              className={`px-3 py-2 text-xs text-slate-800 ${
                col.align === 'right' ? 'text-right' : 'text-left'
              } overflow-hidden text-ellipsis whitespace-nowrap`}
              style={{ width, minWidth: width }}
              title={row[col.field] != null ? String(row[col.field]) : ''}
            >
              {ReportEngine.formatValue(row[col.field], col, language)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderGroupedRow = (node: GroupedDataNode, index: number) => {
    const isExpanded = expandedGroups.has(node.groupKey);
    const hasChildren = node.children.length > 0;
    const { total, delivered, perc } = getGroupDeliveryInfo(node);

    let badgeClass = 'bg-orange-100 text-orange-800';
    let barClass = 'bg-orange-500';
    if (perc >= 75) {
      badgeClass = 'bg-emerald-100 text-emerald-700';
      barClass = 'bg-emerald-500';
    } else if (perc >= 26) {
      badgeClass = 'bg-amber-100 text-amber-800';
      barClass = 'bg-amber-400';
    }

    return (
      <div key={`${node.groupKey}-${index}`} className="bg-white">
        <div
          className="flex items-center justify-between border-b border-sky-200 bg-gradient-to-r from-sky-100 to-sky-50 hover:from-sky-200/80 hover:to-sky-100/80 cursor-pointer px-4 py-2.5"
          onClick={() => hasChildren && toggleGroup(node.groupKey)}
        >
          <div className="flex items-center gap-2">
            {hasChildren && (
              <span className="rounded-full bg-white/90 p-1 shadow-sm">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-sky-700" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-sky-700" />
                )}
              </span>
            )}
            <span className="text-sm font-bold text-sky-950">
              {TEXTS.labelOrder[language as keyof typeof TEXTS.labelOrder]}:{' '}
              {node.groupLabel}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-[1px] rounded-full ${badgeClass}`}
            >
              {perc}%{' '}
              {TEXTS.labelDelivered[language as keyof typeof TEXTS.labelDelivered]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-sky-900">
              {TEXTS.labelFulfilled[language as keyof typeof TEXTS.labelFulfilled]}{' '}
              {delivered}/{total}
            </span>
            <div className="w-28 h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-2.5 transition-all ${barClass}`}
                style={{ width: `${perc}%` }}
              />
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="border-l border-slate-100">
            {node.children.map((child: any, i: number) =>
              'groupKey' in child ? renderGroupedRow(child, i) : renderDataRow(child, i)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100 overflow-hidden flex flex-col max-h-[72vh]">
      {/* header tabella */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/80 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setShowOnlyPending((p) => !p)}
          className={`inline-flex items-center gap-2 text-sm font-semibold rounded-full px-4 py-1.5 transition ${
            showOnlyPending
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          <span className="text-xs">●</span>
          {TEXTS.buttonShowOnlyPending[
            language as keyof typeof TEXTS.buttonShowOnlyPending
          ]}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 shadow-sm"
          >
            {TEXTS.buttonExcel[language as keyof typeof TEXTS.buttonExcel]}
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 shadow-sm"
          >
            {TEXTS.buttonPDF[language as keyof typeof TEXTS.buttonPDF]}
          </button>
        </div>
      </div>

      {/* intestazione colonne */}
      <div className="flex border-b border-slate-200 bg-slate-100/90 sticky top-0 z-10">
        {visibleColumns.map((col) => {
          const width = columnWidths[col.field] || 120;
          return (
            <div
              key={col.field}
              className={`px-3 py-2 text-[11px] font-semibold text-slate-700 uppercase tracking-wide ${
                col.align === 'right' ? 'text-right' : 'text-left'
              } overflow-hidden text-ellipsis whitespace-nowrap`}
              style={{ width, minWidth: width }}
            >
              {getColumnLabelFromField(col.field, language)}
            </div>
          );
        })}
      </div>

      {/* corpo tabella */}
      <div className="flex-1 overflow-auto">
        {filteredData.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            {
              TEXTS.messageNoDocuments[
                language as keyof typeof TEXTS.messageNoDocuments
              ]
            }
          </div>
        ) : isGrouped && 'groupKey' in filteredData[0] ? (
          (filteredData as GroupedDataNode[]).map((node, idx) =>
            renderGroupedRow(node, idx)
          )
        ) : (
          (filteredData as any[]).map((row, idx) => renderDataRow(row, idx))
        )}
      </div>

      {/* footer totali */}
      {aggregates && Object.keys(aggregates).length > 0 && (
        <div className="flex border-t border-slate-200 bg-blue-50/80">
          {visibleColumns.map((col, idx) => {
            const width = columnWidths[col.field] || 120;
            return (
              <div
                key={col.field}
                className={`px-3 py-2 text-xs ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                } overflow-hidden text-ellipsis whitespace-nowrap`}
                style={{ width, minWidth: width }}
              >
                {idx === 0 ? (
                  <span className="font-bold text-slate-900">
                    {TEXTS.labelTotal[language as keyof typeof TEXTS.labelTotal]}
                  </span>
                ) : col.aggregate && aggregates[col.field] !== undefined ? (
                  <span className="font-bold text-slate-900">
                    {ReportEngine.formatValue(aggregates[col.field], col, language)}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}