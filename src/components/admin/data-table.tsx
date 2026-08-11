import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

/**
 * Read-only admin table. Collapses to stacked cards below `md` so it never
 * overflows horizontally on a phone.
 */
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  emptyTitle,
  emptyDescription,
}: {
  rows: T[];
  columns: Column<T>[];
  emptyTitle: string;
  emptyDescription?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-card border border-border md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-elevated">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn("px-5 py-3 text-left font-medium text-subtle", column.className)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border bg-card hover:bg-card-hover">
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-5 py-4 align-middle", column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-card border border-border bg-card p-4">
            <dl className="space-y-2">
              {columns.map((column) => (
                <div key={column.key} className="flex items-start justify-between gap-4">
                  <dt className="text-xs text-subtle">{column.header}</dt>
                  <dd className="text-right text-sm">{column.render(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
