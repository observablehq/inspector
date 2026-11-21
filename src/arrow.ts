import type * as Arrow from "apache-arrow";

// Returns true if the vaue is an Apache Arrow table. This uses a “duck” test
// (instead of strict instanceof) because we want it to work with a range of
// Apache Arrow versions at least 7.0.0 or above.
// https://arrow.apache.org/docs/7.0/js/classes/Arrow_dom.Table.html
type FlechetteColumn = {
  data: {values: unknown; isValid(index: number): boolean}[];
  offsets: ArrayLike<number>;
};

// Returns the value of the given column at the given row index. Flechette
// throws when extracting a 64-bit integer that is outside the safe integer
// range (unless the table was decoded with useBigInt); in that case, return the
// raw BigInt instead. Any other error is returned (rather than thrown) so that
// it is isolated to the cell that produced it.
export function getArrowCell(column: Arrow.Vector | null, index: number): unknown {
  try {
    return column?.get(index);
  } catch (error) {
    const value = getFlechetteBigInt(column, index);
    return value === undefined ? error : value;
  }
}

function getFlechetteBigInt(column: unknown, index: number): bigint | null | undefined {
  if (!isFlechetteColumn(column)) return;
  const {data, offsets} = column;
  let b = 0;
  while (b < data.length - 1 && offsets[b + 1] <= index) ++b;
  const batch = data[b];
  const j = index - offsets[b];
  const {values} = batch;
  if (values instanceof BigInt64Array || values instanceof BigUint64Array) {
    return batch.isValid(j) ? values[j] : null;
  }
}

function isFlechetteColumn(value: unknown): value is FlechetteColumn {
  return (
    value !== null &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray(value.data) &&
    "offsets" in value &&
    ArrayBuffer.isView(value.offsets)
  );
}

export function isArrowTable(value: unknown): value is Arrow.Table {
  return (
    value !== null &&
    typeof value === "object" &&
    "getChild" in value &&
    typeof value.getChild === "function" &&
    "toArray" in value &&
    typeof value.toArray === "function" &&
    "schema" in value &&
    value.schema !== null &&
    typeof value.schema === "object" &&
    "fields" in value.schema &&
    Array.isArray(value.schema.fields)
  );
}
