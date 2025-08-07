export interface TopModel {
  name: string;
  unit: number;
}

export interface TopBranch {
  code: string;
  unit: number;
}

export function calculateTotalUnitSales(sales: any[]): number {
  return sales
    .map((unit) => Number(unit.unit_sold))
    .reduce((total, current) => total + current, 0);
}

export function findTopModel(sales: any[]): TopModel | null {
  if (!sales.length) return null;

  const top = sales.reduce(
    (best, current) =>
      Number(current.unit_sold) > best.unit
        ? { name: current.unit_name, unit: Number(current.unit_sold) }
        : best,
    { name: '', unit: -1 }
  );

  return top.unit >= 0 ? top : null;
}

export function findTopBranch(sales: any[], cabangMapper: (code: string) => string): TopBranch | null {
  if (!sales.length) return null;

  const top = sales.reduce(
    (best, current) =>
      Number(current.unit_sold) > best.unit
        ? { code: current.branch, unit: Number(current.unit_sold) }
        : best,
    { code: '', unit: -1 }
  );

  if (top.unit < 0) return null;

  return {
    code: cabangMapper(top.code),
    unit: top.unit,
  };
}
