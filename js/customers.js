import { getCollection, saveCollection, nextId } from "./storage.js";
import { openModal, closeModal } from "./modal.js";
import { toast } from "./toast.js";
import { paginate, paginationHtml } from "./pagination.js";

const state = { q: "", sort: "", page: 1 };
const PAGE_SIZE = 7;
export function init() {
  render();
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[ch],
  );
}

function getFiltered() {
  const source = getCollection("customers");
  const q = normalize(state.q);
  const fields = ["id", "name", "email", "phone", "company", "city", "status"];
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
    `<div class="page-head"><div><h2>Customer Management</h2><p>Manage customers, contacts and customer status.</p></div></div><div class="card"><div class="card-body"><div class="toolbar"><div class="toolbar-left" style="flex:1;min-width:260px"><div class="search" style="width:100%"><input id="customerSearch" type="search" autocomplete="off" spellcheck="false" placeholder="Search name, email, phone, company, city, status..." value="${escapeHtml(state.q)}"></div><select id="customerSort" class="field input"><option value="">Sort customers</option><option value="name:asc">Name A-Z</option><option value="name:desc">Name Z-A</option><option value="city:asc">City A-Z</option><option value="status:asc">Status</option></select></div><div class="toolbar-right"><span id="customerCount" class="muted"></span><button class="btn btn-light" id="clearCustomerSearch">Clear</button><button class="btn btn-primary" id="add">＋ Add Customer</button></div></div></div><div class="table-wrap"><table><thead><tr><th>Customer</th><th>City</th><th>Company</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead><tbody id="customerRows"></tbody></table></div><div class="card-body" id="customerPagination"></div></div>`;
  const input = document.getElementById("customerSearch");
  const sort = document.getElementById("customerSort");
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
  document.getElementById("clearCustomerSearch").onclick = () => {
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
  const all = getFiltered();
  const p = paginate(all, state.page, PAGE_SIZE);
  document.getElementById("customerRows").innerHTML =
    p.items.map(row).join("") ||
    `<tr><td colspan="6"><div class="empty">No customers found.</div></td></tr>`;
  document.getElementById("customerCount").textContent =
    `${all.length} result${all.length === 1 ? "" : "s"}`;
  document.getElementById("customerPagination").innerHTML = paginationHtml(
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
  return `<tr><td><div class="person"><div class="table-avatar">${escapeHtml(initials(x.name))}</div><div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.email)}</small></div></div></td><td>${escapeHtml(x.city)}</td><td>${escapeHtml(x.company)}</td><td>${escapeHtml(x.phone)}</td><td><span class="badge ${x.status === "Active" ? "badge-success" : "badge-neutral"}">${escapeHtml(x.status)}</span></td><td><div class="actions"><button class="btn btn-light" data-edit="${x.id}">Edit</button><button class="btn btn-danger" data-delete="${x.id}">Delete</button></div></td></tr>`;
}
function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function form(id) {
  const x = getCollection("customers").find(
    (a) => Number(a.id) === Number(id),
  ) || {
    name: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    status: "Active",
  };
  openModal({
    title: id ? "Edit Customer" : "Add Customer",
    body: `<form id="customerForm" class="form-grid"><div class="field"><label>Name</label><input name="name" value="${escapeHtml(x.name)}" required></div><div class="field"><label>Email</label><input name="email" type="email" value="${escapeHtml(x.email)}" required></div><div class="field"><label>Phone</label><input name="phone" value="${escapeHtml(x.phone)}"></div><div class="field"><label>City</label><input name="city" value="${escapeHtml(x.city)}"></div><div class="field"><label>Company</label><input name="company" value="${escapeHtml(x.company)}"></div><div class="field"><label>Status</label><select name="status"><option ${x.status === "Active" ? "selected" : ""}>Active</option><option ${x.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div></form>`,
    footer: `<button class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" id="saveCustomer">Save Customer</button>`,
  });
  document.getElementById("saveCustomer").onclick = () => {
    const formEl = document.getElementById("customerForm");
    if (!formEl.reportValidity()) return;
    const data = Object.fromEntries(new FormData(formEl));
    let list = getCollection("customers");
    list = id
      ? list.map((v) =>
          Number(v.id) === Number(id) ? { ...data, id: Number(id) } : v,
        )
      : [...list, { ...data, id: nextId(list) }];
    saveCollection("customers", list);
    closeModal();
    toast("Customer saved.");
    updateResults();
  };
}
function remove(id) {
  if (!confirm("Delete this customer?")) return;
  saveCollection(
    "customers",
    getCollection("customers").filter((x) => Number(x.id) !== Number(id)),
  );
  toast("Customer deleted.", "warning");
  state.page = 1;
  updateResults();
}
