export function filterSort(items, query = "", sort = "") {
  let a = [...items];
  const q = query.trim().toLowerCase();
  if (q)
    a = a.filter((x) =>
      Object.values(x).some((v) => String(v).toLowerCase().includes(q)),
    );
  if (sort) {
    const [key, dir] = sort.split(":");
    a.sort(
      (x, y) =>
        String(x[key] ?? "").localeCompare(String(y[key] ?? ""), undefined, {
          numeric: true,
          sensitivity: "base",
        }) * (dir === "desc" ? -1 : 1),
    );
  }
  return a;
}
