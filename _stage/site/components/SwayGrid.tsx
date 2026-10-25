"use client";

// AG Grid in the site's own look: the design's type and colour tokens, hairline rules, roomy rows,
// no boxy chrome. Used by /xray and /ops.

import {
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  NumberFilterModule,
  QuickFilterModule,
  RowAutoHeightModule,
  RowStyleModule,
  TextFilterModule,
  themeQuartz,
  type ColDef,
  type RowClassRules,
} from "ag-grid-community";
import { AgGridProvider, AgGridReact } from "ag-grid-react";

const modules = [ClientSideRowModelModule, TextFilterModule, NumberFilterModule, QuickFilterModule, ColumnAutoSizeModule, RowAutoHeightModule, RowStyleModule];

const theme = themeQuartz.withParams({
  fontFamily: "inherit",
  fontSize: 15,
  backgroundColor: "var(--color-background-100)",
  foregroundColor: "var(--color-foreground-100)",
  textColor: "var(--color-foreground-100)",
  accentColor: "var(--color-foreground-100)",
  borderColor: "var(--color-foreground-10)",
  headerBackgroundColor: "var(--color-background-100)",
  headerTextColor: "var(--color-foreground-50)",
  headerFontWeight: 500,
  headerFontSize: 13,
  rowHoverColor: "var(--color-foreground-5)",
  selectedRowBackgroundColor: "var(--color-foreground-5)",
  oddRowBackgroundColor: "var(--color-background-100)",
  wrapperBorder: false,
  wrapperBorderRadius: 0,
  columnBorder: false,
  headerColumnBorder: false,
  headerColumnResizeHandleColor: "transparent",
  rowHeight: 60,
  headerHeight: 48,
  cellHorizontalPadding: 20,
  iconSize: 14,
});

export function SwayGrid<T extends object>({
  rows,
  columns,
  rowClassRules,
  search,
  height,
}: {
  rows: T[];
  columns: ColDef<T>[];
  rowClassRules?: RowClassRules<T>;
  search?: string;
  /** Fixed height in px; omitted = grow with the rows. */
  height?: number;
}) {
  return (
    <div className="sw-grid" style={height ? { height } : undefined}>
      <AgGridProvider modules={modules}>
        <AgGridReact<T>
          theme={theme}
          rowData={rows}
          columnDefs={columns}
          defaultColDef={{ resizable: true, sortable: true, suppressMovable: true }}
          rowClassRules={rowClassRules}
          quickFilterText={search}
          domLayout={height ? "normal" : "autoHeight"}
          autoSizeStrategy={{ type: "fitGridWidth" }}
          enableCellTextSelection
          suppressCellFocus
        />
      </AgGridProvider>
    </div>
  );
}

export function Badge({ tone, children }: { tone: "warn" | "ok" | "muted" | "amber"; children: React.ReactNode }) {
  return (
    <span className="sw-badge" data-tone={tone}>
      {children}
    </span>
  );
}

/** How often the choice changed without this page; the orange tick is the agent's normal wobble. */
export function FlipBar({ value, noise }: { value: number; noise: number }) {
  return (
    <span className="sw-flip">
      <span className="sw-flip-track">
        <span className="sw-flip-fill" style={{ width: `${value * 100}%` }} />
        <span className="sw-flip-noise" style={{ left: `${noise * 100}%` }} />
      </span>
      <span className="sw-num">{Math.round(value * 100)}%</span>
    </span>
  );
}
