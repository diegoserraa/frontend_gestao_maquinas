import React from "react";

export type CardColumn<T> = {
  render: (row: T) => React.ReactNode;
};

interface Props<T> {
  columns: CardColumn<T>[];
  data: T[];
}

export function DataCards<T extends object>({
  columns,
  data,
}: Props<T>) {
  return (
    <div className="space-y-3">
      {data.map((row, index) => (
        <div key={index}>
          {columns.map((col, i) => (
            <div key={i}>
              {col.render(row)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}