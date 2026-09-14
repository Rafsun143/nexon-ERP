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
  const source = getCollection("employees");
  const query = normalize(state.q);
  const fields = [
    "id",
    "name",
    "email",
    "phone",
    "role",
    "department",
    "salary",
    "status",
  ];
  const filtered = query
    ? source.filter((item) =>
        fields.some((key) => normalize(item[key]).includes(query)),
      )
    : source;

  const sorted = [...filtered];
  if (state.sort) {
    const [key, direction] = state.sort.split(":");
    sorted.sort((a, b) => {
      const av = a[key] ?? "";
      const bv = b[key] ?? "";
      const numeric = Number(av) - Number(bv);
      const result =
        Number.isFinite(numeric) && av !== "" && bv !== ""
          ? numeric
          : String(av).localeCompare(String(bv), undefined, {
              numeric: true,
              sensitivity: "base",
            });
      return direction === "desc" ? -result : result;
    });
  }
  return sorted;
}

function render() {
  document.getElementById("pageContent").innerHTML = `
    <div class="page-head"><div><h2>Employee Management</h2><p>Manage staff, roles, departments and employment status.</p></div></div>
    <div class="card">
      <div class="card-body">
        <div class="toolbar">
          <div class="toolbar-left" style="flex:1;min-width:260px">
            <div class="search" style="width:100%">
              <input id="employeeSearch" type="search" autocomplete="off" spellcheck="false"
                placeholder="Search name, email, phone, role, department, status..." value="${escapeHtml(state.q)}">
            </div>
            <select id="employeeSort" class="field input">
              <option value="">Sort employees</option>
              <option value="name:asc">Name A-Z</option>
              <option value="name:desc">Name Z-A</option>
              <option value="salary:desc">Salary high-low</option>
              <option value="salary:asc">Salary low-high</option>
              <option value="status:asc">Status</option>
            </select>
          </div>
          <div class="toolbar-right"><span id="employeeCount" class="muted"></span><button class="btn btn-light" id="clearEmployeeSearch">Clear</button><button class="btn btn-primary" id="add">＋ Add Employee</button></div>
        </div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Employee</th><th>Department</th><th>Role</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead><tbody id="employeeRows"></tbody></table></div>
      <div class="card-body" id="employeePagination"></div>
    </div>`;

  const sort = document.getElementById("employeeSort");
  sort.value = state.sort;
  document.getElementById("employeeSearch").addEventListener("input", (e) => {
    state.q = e.target.value;
    state.page = 1;
    updateResults();
  });
  document.getElementById("employeeSearch").addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      state.q = "";
      state.page = 1;
      e.target.value = "";
      updateResults();
    }
  });
  document.getElementById("clearEmployeeSearch").onclick = () => {
    state.q = "";
    state.page = 1;
    const input = document.getElementById("employeeSearch");
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
  const result = paginate(getFiltered(), state.page, PAGE_SIZE);
  document.getElementById("employeeRows").innerHTML =
    result.items.map(row).join("") ||
    `<tr><td colspan="6"><div class="empty">No employees found.</div></td></tr>`;
  document.getElementById("employeeCount").textContent =
    `${getFiltered().length} result${getFiltered().length === 1 ? "" : "s"}`;
  document.getElementById("employeePagination").innerHTML = paginationHtml(
    result.page,
    result.total,
  );
  document.querySelectorAll("[data-page]").forEach(
    (btn) =>
      (btn.onclick = () => {
        state.page = Number(btn.dataset.page);
        updateResults();
      }),
  );
  document
    .querySelectorAll("[data-edit]")
    .forEach((btn) => (btn.onclick = () => form(Number(btn.dataset.edit))));
  document
    .querySelectorAll("[data-delete]")
    .forEach((btn) => (btn.onclick = () => remove(Number(btn.dataset.delete))));
}

function row(x) {
  return `<tr><td><div class="person"><div class="table-avatar">${escapeHtml(initials(x.name))}</div><div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.email)}<br>${escapeHtml(x.phone)}</small></div></div></td><td>${escapeHtml(x.department)}</td><td>${escapeHtml(x.role)}</td><td>৳${Number(x.salary || 0).toLocaleString()}</td><td><span class="badge ${x.status === "Active" ? "badge-success" : "badge-neutral"}">${escapeHtml(x.status)}</span></td><td><div class="actions"><button class="btn btn-light" data-edit="${x.id}">Edit</button><button class="btn btn-danger" data-delete="${x.id}">Delete</button></div></td></tr>`;
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
  const x = getCollection("employees").find(
    (a) => Number(a.id) === Number(id),
  ) || {
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
    body: `<form id="employeeForm" class="form-grid"><div class="field"><label>Name</label><input name="name" value="${escapeHtml(x.name)}" required></div><div class="field"><label>Email</label><input name="email" type="email" value="${escapeHtml(x.email)}" required></div><div class="field"><label>Phone</label><input name="phone" value="${escapeHtml(x.phone)}"></div><div class="field"><label>Department</label><input name="department" value="${escapeHtml(x.department)}"></div><div class="field"><label>Role</label><input name="role" value="${escapeHtml(x.role)}"></div><div class="field"><label>Salary</label><input name="salary" type="number" min="0" value="${Number(x.salary) || 0}"></div><div class="field"><label>Status</label><select name="status"><option ${x.status === "Active" ? "selected" : ""}>Active</option><option ${x.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div></form>`,
    footer: `<button class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" id="saveEmployee">Save Employee</button>`,
  });
  document.getElementById("saveEmployee").onclick = () => {
    const formEl = document.getElementById("employeeForm");
    if (!formEl.reportValidity()) return;
    const data = Object.fromEntries(new FormData(formEl));
    data.salary = Number(data.salary || 0);
    let list = getCollection("employees");
    list = id
      ? list.map((v) =>
          Number(v.id) === Number(id) ? { ...data, id: Number(id) } : v,
        )
      : [...list, { ...data, id: nextId(list) }];
    saveCollection("employees", list);
    closeModal();
    toast("Employee saved.");
    updateResults();
  };
}

function remove(id) {
  if (!confirm("Delete this employee?")) return;
  saveCollection(
    "employees",
    getCollection("employees").filter((x) => Number(x.id) !== Number(id)),
  );
  toast("Employee deleted.", "warning");
  state.page = 1;
  updateResults();
}
