import { initTheme } from "./theme.js";
import { renderShell } from "./navigation.js";
import { initAuth } from "./auth.js";
import { getCollection } from "./storage.js";
import { barChart, lineChart } from "./charts.js";
initTheme();
const page = document.body.dataset.page;
if (["login", "signup", "forgot-password", "reset-password"].includes(page)) {
  initAuth(page);
} else {
  const ok = localStorage.getItem("nexora_auth");
  if (!ok) {
    location.href = "login.html";
  } else {
    const titles = {
      dashboard: "Dashboard",
      employees: "Employees",
      customers: "Customers",
      products: "Products",
      inventory: "Inventory",
      sales: "Sales",
      invoices: "Invoices",
      finance: "Finance",
      reports: "Reports",
      notifications: "Notifications",
      profile: "My Profile",
    };
    renderShell(titles[page] || "NEXORA ERP");
    const modules = {
      employees: "./employees.js",
      customers: "./customers.js",
      products: "./products.js",
      inventory: "./inventory.js",
      sales: "./sales.js",
      invoices: "./invoices.js",
      finance: "./finance.js",
      reports: "./reports.js",
    };
    if (modules[page]) import(modules[page]).then((m) => m.init());
    else if (page === "dashboard") dashboard();
    else if (page === "notifications") notifications();
    else if (page === "profile") profile();
  }
}
function dashboard() {
  const o = getCollection("orders"),
    p = getCollection("products"),
    c = getCollection("customers"),
    e = getCollection("employees"),
    f = getCollection("finance");
  const rev = o.reduce((s, x) => s + x.total, 0),
    low = p.filter((x) => x.status !== "In Stock").length;
  document.getElementById("pageContent").innerHTML =
    `<div class="card welcome"><div class="card-body"><h2>Welcome to NEXORA ERP 👋</h2><p>Run your sales, inventory, customer and financial operations from one responsive workspace.</p><div class="quick-grid"><a class="quick" href="sales.html">＋ New Sale</a><a class="quick" href="products.html">＋ Product</a><a class="quick" href="employees.html">＋ Employee</a><a class="quick" href="reports.html">View Reports</a></div></div></div><div class="grid grid-4 section-gap"><div class="card stat-card"><div class="stat-top"><span class="stat-icon">💰</span><span class="trend up">Today</span></div><div class="stat-value money">৳${rev.toLocaleString()}</div><div class="stat-label">Total Order Revenue</div></div><div class="card stat-card"><div class="stat-top"><span class="stat-icon">🛒</span></div><div class="stat-value">${o.length}</div><div class="stat-label">Orders</div></div><div class="card stat-card"><div class="stat-top"><span class="stat-icon">👥</span></div><div class="stat-value">${c.length}</div><div class="stat-label">Customers</div></div><div class="card stat-card"><div class="stat-top"><span class="stat-icon">📦</span></div><div class="stat-value">${p.reduce((s, x) => s + x.quantity, 0)}</div><div class="stat-label">Units in Stock</div></div></div><div class="dashboard-grid section-gap"><div class="card"><div class="card-header"><h3 class="card-title">Revenue Overview</h3></div><div class="card-body"><div class="chart-box"><canvas id="dashChart"></canvas></div></div></div><div class="card"><div class="card-header"><h3 class="card-title">Recent Activity</h3></div><div class="card-body"><div class="list">${o
      .slice(0, 5)
      .map(
        (x) =>
          `<div class="list-item"><div><b>Order #${x.id}</b><div class="muted" style="font-size:10px">${x.customer}</div></div><strong>৳${x.total.toLocaleString()}</strong></div>`,
      )
      .join(
        "",
      )}</div>${low ? `<div class="notice">⚠ ${low} products need stock attention.</div>` : ""}</div></div></div>`;
  lineChart(
    "dashChart",
    f.map((x) => x.month),
    [
      {
        label: "Revenue",
        data: f.map((x) => x.income),
        tension: 0.35,
        fill: true,
      },
      { label: "Expenses", data: f.map((x) => x.expenses), tension: 0.35 },
    ],
  );
}
function notifications() {
  import("./notifications.js").then(({ getNotifications, markRead }) => {
    const n = getNotifications();
    document.getElementById("pageContent").innerHTML =
      `<div class="page-head"><div><h2>Notifications</h2><p>Alerts, order events and system updates.</p></div></div><div class="card"><div class="card-body"><div class="list">${n.map((x) => `<div class="list-item"><div><div style="display:flex;gap:9px;align-items:center"><span class="activity-dot"></span><b>${x.title}</b>${!x.read ? '<span class="badge badge-danger">NEW</span>' : ""}</div><div class="muted" style="font-size:11px;margin-top:5px">${x.message}</div><small class="muted">${x.time}</small></div>${!x.read ? `<button class="btn btn-light" data-read="${x.id}">Mark read</button>` : ""}</div>`).join("")}</div></div></div>`;
    document.querySelectorAll("[data-read]").forEach(
      (b) =>
        (b.onclick = () => {
          markRead(+b.dataset.read);
          notifications();
        }),
    );
  });
}
function profile() {
  const u = JSON.parse(
    localStorage.getItem("nexora_user") ||
      '{"name":"Admin","email":"admin@nexora.local","role":"Admin"}',
  );
  document.getElementById("pageContent").innerHTML =
    `<div class="page-head"><div><h2>My Profile</h2><p>Account and workspace information.</p></div></div><div class="grid grid-2"><div class="card"><div class="card-body"><div style="display:flex;gap:15px;align-items:center"><div class="avatar" style="width:62px;height:62px;font-size:18px">${u.name
      .split(" ")
      .map((x) => x[0])
      .slice(0, 2)
      .join(
        "",
      )}</div><div><h3 style="margin:0">${u.name}</h3><p class="muted" style="margin:5px 0">${u.email}</p><span class="badge badge-info">${u.role || "Employee"}</span></div></div><div class="divider"></div><div class="mini-stat"><span class="muted">Authentication</span><strong>Frontend LocalStorage</strong></div></div></div><div class="card"><div class="card-header"><h3 class="card-title">Workspace</h3></div><div class="card-body"><div class="list-item"><span class="muted">Application</span><b>NEXORA ERP</b></div><div class="list-item"><span class="muted">Currency</span><b>৳ BDT</b></div><div class="list-item"><span class="muted">Mode</span><b>Frontend Demo</b></div></div></div></div>`;
}
