import { getCollection, saveCollection, nextId } from "./storage.js";
import { openModal, closeModal } from "./modal.js";
import { toast } from "./toast.js";
import { filterSort } from "./search.js";
import { paginate, paginationHtml } from "./pagination.js";
const S = { q: "", sort: "", page: 1 };
export function init() {
  render();
}
function render() {
  const all = filterSort(getCollection("customers"), S.q, S.sort),
    p = paginate(all, S.page, 7);
  document.getElementById("pageContent").innerHTML =
    `${head()}<div class="card"><div class="card-body"><div class="toolbar"><div class="search"><input id="q" placeholder="Search customers..." value="${S.q}"></div><select id="sort" class="field input"><option value="">Sort</option><option value="name:asc">Name A-Z</option><option value="status:desc">Salary high-low</option><option value="status:asc">Status</option></select><button class="btn btn-primary" id="add">＋ Add Customer</button></div></div><div class="table-wrap"><table><thead><tr><th>Customer</th><th>City</th><th>Company</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead><tbody>${p.items.map((x) => row(x)).join("") || `<tr><td colspan="6"><div class="empty">No customers found.</div></td></tr>`}</tbody></table></div><div class="card-body">${paginationHtml(p.page, p.total)}</div></div>`;
  document.getElementById("q").oninput = (e) => {
    S.q = e.target.value;
    S.page = 1;
    render();
  };
  document.getElementById("sort").onchange = (e) => {
    S.sort = e.target.value;
    render();
  };
  document.getElementById("add").onclick = () => form();
  document
    .querySelectorAll("[data-edit]")
    .forEach((b) => (b.onclick = () => form(Number(b.dataset.edit))));
  document
    .querySelectorAll("[data-delete]")
    .forEach((b) => (b.onclick = () => del(Number(b.dataset.delete))));
  document.querySelectorAll("[data-page]").forEach(
    (b) =>
      (b.onclick = () => {
        S.page = Number(b.dataset.page);
        render();
      }),
  );
}
function head() {
  return `<div class="page-head"><div><h2>Customer Management</h2><p>Manage customers, contacts and employment status.</p></div></div>`;
}
function row(x) {
  return `<tr><td><div class="person"><div class="table-avatar">${initials(x.name)}</div><div><strong>${x.name}</strong><small>${x.email}</small></div></div></td><td>${x.city}</td><td>${x.company}</td><td>৳${Number(x.status).toLocaleString()}</td><td><span class="badge ${x.status === "Active" ? "badge-success" : "badge-neutral"}">${x.status}</span></td><td><div class="actions"><button class="btn btn-light" data-edit="${x.id}">Edit</button><button class="btn btn-danger" data-delete="${x.id}">Delete</button></div></td></tr>`;
}
function initials(n) {
  return n
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
}
function form(id) {
  const x = getCollection("customers").find((a) => a.id === id) || {
    name: "",
    email: "",
    phone: "",
    company: "Customer",
    city: "Sales",
    status: 0,
    status: "Active",
  };
  openModal({
    title: id ? "Edit Customer" : "Add Customer",
    body: `<form id="f" class="form-grid"><div class="field"><label>Name</label><input name="name" value="${x.name}" required></div><div class="field"><label>Email</label><input name="email" type="email" value="${x.email}" required></div><div class="field"><label>Phone</label><input name="phone" value="${x.phone}"></div><div class="field"><label>City</label><input name="city" value="${x.city}"></div><div class="field"><label>Company</label><input name="company" value="${x.company}"></div><div class="field"><label>Salary</label><input name="status" type="text" value="${x.status}"></div><div class="field"><label>Status</label><select name="status"><option ${x.status === "Active" ? "selected" : ""}>Active</option><option ${x.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div></form>`,
    footer: `<button class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" id="save">Save Customer</button>`,
  });
  document.getElementById("save").onclick = () => {
    const d = Object.fromEntries(new FormData(document.getElementById("f")));
    d.status = Number(d.status);
    let a = getCollection("customers");
    if (id) a = a.map((v) => (v.id === id ? { ...d, id } : v));
    else a.push({ ...d, id: nextId(a) });
    saveCollection("customers", a);
    closeModal();
    toast("Customer saved.");
    render();
  };
}
function del(id) {
  if (!confirm("Delete this customer?")) return;
  saveCollection(
    "customers",
    getCollection("customers").filter((x) => x.id !== id),
  );
  toast("Customer deleted.", "warning");
  render();
}
