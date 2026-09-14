export function paginate(items, page, size) {
  const total = Math.max(1, Math.ceil(items.length / size));
  page = Math.min(Math.max(1, page), total);
  return { items: items.slice((page - 1) * size, page * size), page, total };
}
export function paginationHtml(page, total) {
  if (total <= 1) return "";
  return `<div class="pagination">${Array.from({ length: total }, (_, i) => `<button class="page-btn ${i + 1 === page ? "active" : ""}" data-page="${i + 1}">${i + 1}</button>`).join("")}</div>`;
}
