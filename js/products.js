import { getCollection, saveCollection, nextId } from "./storage.js";
import { openModal, closeModal } from "./modal.js";
import { toast } from "./toast.js";
import { paginate, paginationHtml } from "./pagination.js";

const state = { q: "", sort: "", page: 1 };
const PAGE_SIZE = 7;
export function init() {
  render();
}

function normalize(v) {
  return String(v ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
function escapeHtml(v) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
}
function getFiltered() {
  const source = getCollection("products"),
    q = normalize(state.q);
  const fields = [
    "id",
    "name",
    "category",
    "price",
    "quantity",
    "reorder",
    "status",
  ];
  const filtered = q
    ? source.filter((x) => fields.some((k) => normalize(x[k]).includes(q)))
    : source;
  const sorted = [...filtered];
  if (state.sort) {
    const [key, dir] = state.sort.split(":");
    sorted.sort((a, b) => {
      const av = a[key] ?? "",
        bv = b[key] ?? "";
      const n = Number(av) - Number(bv);
      const r =
        Number.isFinite(n) && av !== "" && bv !== ""
          ? n
          : String(av).localeCompare(String(bv), undefined, {
              numeric: true,
              sensitivity: "base",
            });
      return dir === "desc" ? -r : r;
    });
  }
  return sorted;
}
function render() {
  document.getElementById("pageContent").innerHTML =
    `<div class="page-head"><div><h2>Product Management</h2><p>Catalog, pricing and stock status.</p></div></div><div class="card"><div class="card-body"><div class="toolbar"><div class="toolbar-left" style="flex:1;min-width:260px"><div class="search" style="width:100%"><input id="productSearch" type="search" autocomplete="off" spellcheck="false" placeholder="Search name, category, price, quantity, stock..." value="${escapeHtml(state.q)}"></div><select id="productSort" class="field input"><option value="">Sort products</option><option value="name:asc">Name A-Z</option><option value="name:desc">Name Z-A</option><option value="price:desc">Price high-low</option><option value="price:asc">Price low-high</option><option value="quantity:desc">Stock high-low</option><option value="quantity:asc">Stock low-high</option><option value="status:asc">Stock status</option></select></div><div class="toolbar-right"><span id="productCount" class="muted"></span><button class="btn btn-light" id="clearProductSearch">Clear</button><button class="btn btn-primary" id="add">＋ Add Product</button></div></div></div><div class="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Quantity</th><th>Stock</th><th>Actions</th></tr></thead><tbody id="productRows"></tbody></table></div><div class="card-body" id="productPagination"></div></div>`;
  const input = document.getElementById("productSearch"),
    sort = document.getElementById("productSort");
  sort.value = state.sort;
  input.addEventListener("input", (e) => {
    state.q = e.target.value;
    state.page = 1;
    updateResults();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      state.q = "";
      state.page = 1;
      input.value = "";
      updateResults();
    }
  });
  document.getElementById("clearProductSearch").onclick = () => {
    state.q = "";
    state.page = 1;
    input.value = "";
    updateResults();
    input.focus();
  };
  sort.onchange = (e) => {
    state.sort = e.target.value;
    state.page = 1;
    updateResults();
  };
  document.getElementById("add").onclick = () => form();
  updateResults();
}
function updateResults() {
  const all = getFiltered(),
    p = paginate(all, state.page, PAGE_SIZE);
  document.getElementById("productRows").innerHTML =
    p.items.map(row).join("") ||
    `<tr><td colspan="6"><div class="empty">No products match your search.</div></td></tr>`;
  document.getElementById("productCount").textContent =
    `${all.length} result${all.length === 1 ? "" : "s"}`;
  document.getElementById("productPagination").innerHTML = paginationHtml(
    p.page,
    p.total,
  );
  document.querySelectorAll("[data-page]").forEach(
    (b) =>
      (b.onclick = () => {
        state.page = Number(b.dataset.page);
        updateResults();
      }),
  );
  document
    .querySelectorAll("[data-edit]")
    .forEach((b) => (b.onclick = () => form(Number(b.dataset.edit))));
  document
    .querySelectorAll("[data-delete]")
    .forEach((b) => (b.onclick = () => remove(Number(b.dataset.delete))));
}
function row(x) {
  const cls =
    x.status === "In Stock"
      ? "badge-success"
      : x.status === "Low Stock"
        ? "badge-warning"
        : "badge-danger";
  return `<tr><td><div class="person"><div class="table-avatar">P</div><div><strong>${escapeHtml(x.name)}</strong><small>ID #${escapeHtml(x.id)}</small></div></div></td><td>${escapeHtml(x.category)}</td><td>৳${Number(x.price || 0).toLocaleString()}</td><td>${Number(x.quantity || 0)}</td><td><span class="badge ${cls}">${escapeHtml(x.status)}</span></td><td><div class="actions"><button class="btn btn-light" data-edit="${x.id}">Edit</button><button class="btn btn-danger" data-delete="${x.id}">Delete</button></div></td></tr>`;
}
function form(id) {
  const x = getCollection("products").find(
    (a) => Number(a.id) === Number(id),
  ) || {
    name: "",
    category: "Electronics",
    price: 0,
    quantity: 0,
    reorder: 5,
    status: "In Stock",
  };
  openModal({
    title: id ? "Edit Product" : "Add Product",
    body: `<form id="productForm" class="form-grid"><div class="field full"><label>Product name</label><input name="name" value="${escapeHtml(x.name)}" required></div><div class="field"><label>Category</label><input name="category" value="${escapeHtml(x.category)}"></div><div class="field"><label>Price</label><input name="price" type="number" min="0" value="${Number(x.price) || 0}"></div><div class="field"><label>Quantity</label><input name="quantity" type="number" min="0" value="${Number(x.quantity) || 0}"></div><div class="field"><label>Reorder level</label><input name="reorder" type="number" min="0" value="${Number(x.reorder) || 0}"></div></form>`,
    footer: `<button class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" id="saveProduct">Save Product</button>`,
  });
  document.getElementById("saveProduct").onclick = () => {
    const formEl = document.getElementById("productForm");
    if (!formEl.reportValidity()) return;
    const d = Object.fromEntries(new FormData(formEl));
    ["price", "quantity", "reorder"].forEach((k) => (d[k] = Number(d[k] || 0)));
    d.status =
      d.quantity <= 0
        ? "Out of Stock"
        : d.quantity <= d.reorder
          ? "Low Stock"
          : "In Stock";
    let list = getCollection("products");
    list = id
      ? list.map((v) =>
          Number(v.id) === Number(id) ? { ...d, id: Number(id) } : v,
        )
      : [...list, { ...d, id: nextId(list) }];
    saveCollection("products", list);
    closeModal();
    toast("Product saved.");
    updateResults();
  };
}
function remove(id) {
  if (!confirm("Delete this product?")) return;
  saveCollection(
    "products",
    getCollection("products").filter((x) => Number(x.id) !== Number(id)),
  );
  toast("Product deleted.", "warning");
  state.page = 1;
  updateResults();
}
