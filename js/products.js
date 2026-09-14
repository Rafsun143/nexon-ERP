import { getCollection, saveCollection, nextId } from "./storage.js";
import { openModal, closeModal } from "./modal.js";
import { toast } from "./toast.js";
import { filterSort } from "./search.js";
import { paginate, paginationHtml } from "./pagination.js";
let S = { q: "", page: 1 };
export function init() {
  render();
}
function render() {
  const all = filterSort(getCollection("products"), S.q),
    p = paginate(all, S.page, 7);
  document.getElementById("pageContent").innerHTML =
    `<div class="page-head"><div><h2>Product Management</h2><p>Catalog, pricing and stock status.</p></div><button class="btn btn-primary" id="add">＋ Add Product</button></div><div class="card"><div class="card-body"><div class="search"><input id="q" placeholder="Search products..." value="${S.q}"></div></div><div class="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Quantity</th><th>Stock</th><th>Actions</th></tr></thead><tbody>${p.items.map((x) => `<tr><td><div class="person"><div class="table-avatar">P</div><div><strong>${x.name}</strong><small>ID #${x.id}</small></div></div></td><td>${x.category}</td><td>৳${x.price.toLocaleString()}</td><td>${x.quantity}</td><td><span class="badge ${x.status === "In Stock" ? "badge-success" : x.status === "Low Stock" ? "badge-warning" : "badge-danger"}">${x.status}</span></td><td><button class="btn btn-light" data-edit="${x.id}">Edit</button> <button class="btn btn-danger" data-delete="${x.id}">Delete</button></td></tr>`).join("")}</tbody></table></div><div class="card-body">${paginationHtml(p.page, p.total)}</div></div>`;
  document.getElementById("q").oninput = (e) => {
    S.q = e.target.value;
    S.page = 1;
    render();
  };
  document.getElementById("add").onclick = () => form();
  document
    .querySelectorAll("[data-edit]")
    .forEach((b) => (b.onclick = () => form(+b.dataset.edit)));
  document
    .querySelectorAll("[data-delete]")
    .forEach((b) => (b.onclick = () => del(+b.dataset.delete)));
  document.querySelectorAll("[data-page]").forEach(
    (b) =>
      (b.onclick = () => {
        S.page = +b.dataset.page;
        render();
      }),
  );
}
function form(id) {
  const x = getCollection("products").find((a) => a.id === id) || {
    name: "",
    category: "Electronics",
    price: 0,
    quantity: 0,
    reorder: 5,
    status: "In Stock",
  };
  openModal({
    title: id ? "Edit Product" : "Add Product",
    body: `<form id="f" class="form-grid"><div class="field full"><label>Product name</label><input name="name" value="${x.name}" required></div><div class="field"><label>Category</label><input name="category" value="${x.category}"></div><div class="field"><label>Price</label><input name="price" type="number" value="${x.price}"></div><div class="field"><label>Quantity</label><input name="quantity" type="number" value="${x.quantity}"></div><div class="field"><label>Reorder level</label><input name="reorder" type="number" value="${x.reorder}"></div></form>`,
    footer: `<button class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" id="save">Save Product</button>`,
  });
  document.getElementById("save").onclick = () => {
    const d = Object.fromEntries(new FormData(document.getElementById("f")));
    ["price", "quantity", "reorder"].forEach((k) => (d[k] = Number(d[k])));
    d.status =
      d.quantity <= 0
        ? "Out of Stock"
        : d.quantity <= d.reorder
          ? "Low Stock"
          : "In Stock";
    let a = getCollection("products");
    if (id) a = a.map((v) => (v.id === id ? { ...d, id } : v));
    else a.push({ ...d, id: nextId(a) });
    saveCollection("products", a);
    closeModal();
    toast("Product saved.");
    render();
  };
}
function del(id) {
  if (confirm("Delete this product?")) {
    saveCollection(
      "products",
      getCollection("products").filter((x) => x.id !== id),
    );
    toast("Product deleted.", "warning");
    render();
  }
}
