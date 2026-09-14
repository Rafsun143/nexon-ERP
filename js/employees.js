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
  const all = filterSort(getCollection("employees"), S.q, S.sort),
    p = paginate(all, S.page, 7);
  document.getElementById("pageContent").innerHTML =
    `${head()}<div class="card"><div class="card-body"><div class="toolbar"><div class="search"><input id="q" placeholder="Search employees..." value="${S.q}"></div><select id="sort" class="field input"><option value="">Sort</option><option value="name:asc">Name A-Z</option><option value="salary:desc">Salary high-low</option><option value="status:asc">Status</option></select><button class="btn btn-primary" id="add">＋ Add Employee</button></div></div><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Department</th><th>Role</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead><tbody>${p.items.map((x) => row(x)).join("") || `<tr><td colspan="6"><div class="empty">No employees found.</div></td></tr>`}</tbody></table></div><div class="card-body">${paginationHtml(p.page, p.total)}</div></div>`;
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
  return `<div class="page-head"><div><h2>Employee Management</h2><p>Manage staff, roles, departments and employment status.</p></div></div>`;
}
function row(x) {
  return `<tr><td><div class="person"><div class="table-avatar">${initials(x.name)}</div><div><strong>${x.name}</strong><small>${x.email}</small></div></div></td><td>${x.department}</td><td>${x.role}</td><td>৳${Number(x.salary).toLocaleString()}</td><td><span class="badge ${x.status === "Active" ? "badge-success" : "badge-neutral"}">${x.status}</span></td><td><div class="actions"><button class="btn btn-light" data-edit="${x.id}">Edit</button><button class="btn btn-danger" data-delete="${x.id}">Delete</button></div></td></tr>`;
}
function initials(n) {
  return n
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
}
function form(id) {
  const x = getCollection("employees").find((a) => a.id === id) || {
    name: "",
    email: "",
    phone: "",
    role: "Employee",
    department: "Sales",
    salary: 0,
    status: "Active",
  };
  openModal({
    title: id ? "Edit Employee" : "Add Employee",
    body: `<form id="f" class="form-grid"><div class="field"><label>Name</label><input name="name" value="${x.name}" required></div><div class="field"><label>Email</label><input name="email" type="email" value="${x.email}" required></div><div class="field"><label>Phone</label><input name="phone" value="${x.phone}"></div><div class="field"><label>Department</label><input name="department" value="${x.department}"></div><div class="field"><label>Role</label><input name="role" value="${x.role}"></div><div class="field"><label>Salary</label><input name="salary" type="number" value="${x.salary}"></div><div class="field"><label>Status</label><select name="status"><option ${x.status === "Active" ? "selected" : ""}>Active</option><option ${x.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div></form>`,
    footer: `<button class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" id="save">Save Employee</button>`,
  });
  document.getElementById("save").onclick = () => {
    const d = Object.fromEntries(new FormData(document.getElementById("f")));
    d.salary = Number(d.salary);
    let a = getCollection("employees");
    if (id) a = a.map((v) => (v.id === id ? { ...d, id } : v));
    else a.push({ ...d, id: nextId(a) });
    saveCollection("employees", a);
    closeModal();
    toast("Employee saved.");
    render();
  };
}
function del(id) {
  if (!confirm("Delete this employee?")) return;
  saveCollection(
    "employees",
    getCollection("employees").filter((x) => x.id !== id),
  );
  toast("Employee deleted.", "warning");
  render();
}
