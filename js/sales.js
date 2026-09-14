import { getCollection, saveCollection, nextId } from "./storage.js";
import { notify } from "./notifications.js";
import { toast } from "./toast.js";
import { CONFIG } from "./config.js";
let cart = [];
export function init() {
  cart = [];
  render();
}
function render() {
  const products = getCollection("products").filter((x) => x.quantity > 0);
  document.getElementById("pageContent").innerHTML =
    `<div class="page-head"><div><h2>Create Sale</h2><p>Select products and build an order.</p></div></div><div class="sale-layout"><div class="card"><div class="card-header"><h3 class="card-title">Products</h3><span class="muted">${products.length} available</span></div><div class="card-body"><div class="product-picker">${products.map((p) => `<div class="product-card" data-add="${p.id}"><strong>${p.name}</strong><small>৳${p.price.toLocaleString()} • ${p.quantity} left</small></div>`).join("")}</div></div></div><div class="card"><div class="card-header"><h3 class="card-title">Cart</h3><button class="btn btn-light" id="clear">Clear</button></div><div class="card-body">${cart.length ? cart.map((x, i) => `<div class="cart-row"><div><strong>${x.name}</strong><small class="muted">৳${x.price.toLocaleString()} each</small></div><input class="qty" data-qty="${i}" type="number" min="1" max="${x.stock}" value="${x.qty}"><strong>৳${(x.qty * x.price).toLocaleString()}</strong><button class="btn btn-danger" data-remove="${i}">×</button></div>`).join("") : `<div class="empty">Cart is empty. Add a product.</div>`}<div class="totals">${totals()}</div>${cart.length ? `<button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:14px" id="checkout">Complete Sale</button>` : ""}</div></div></div>`;
  document
    .querySelectorAll("[data-add]")
    .forEach((b) => (b.onclick = () => add(+b.dataset.add)));
  document.querySelectorAll("[data-remove]").forEach(
    (b) =>
      (b.onclick = () => {
        cart.splice(+b.dataset.remove, 1);
        render();
      }),
  );
  document.querySelectorAll("[data-qty]").forEach(
    (b) =>
      (b.onchange = () => {
        cart[+b.dataset.qty].qty = Math.max(
          1,
          Math.min(cart[+b.dataset.qty].stock, +b.value),
        );
        render();
      }),
  );
  document.getElementById("clear").onclick = () => {
    cart = [];
    render();
  };
  document.getElementById("checkout")?.addEventListener("click", checkout);
}
function add(id) {
  const p = getCollection("products").find((x) => x.id === id),
    x = cart.find((a) => a.id === id);
  if (x) x.qty = Math.min(x.stock, x.qty + 1);
  else
    cart.push({
      id: p.id,
      name: p.name,
      price: p.price,
      qty: 1,
      stock: p.quantity,
    });
  render();
}
function totals() {
  const sub = cart.reduce((s, x) => s + x.qty * x.price, 0),
    discount = sub * CONFIG.DEFAULT_DISCOUNT,
    vat = (sub - discount) * CONFIG.VAT_RATE,
    total = sub - discount + vat;
  return `<div class="total-line"><span>Subtotal</span><strong>৳${sub.toLocaleString()}</strong></div><div class="total-line"><span>Discount (5%)</span><strong>- ৳${discount.toLocaleString()}</strong></div><div class="total-line"><span>VAT (10%)</span><strong>৳${vat.toLocaleString()}</strong></div><div class="total-line grand-total"><span>Total</span><strong>৳${Math.round(total).toLocaleString()}</strong></div>`;
}
function checkout() {
  if (!cart.length) return;
  const db = getCollection("products"),
    sub = cart.reduce((s, x) => s + x.qty * x.price, 0),
    discount = sub * 0.05,
    vat = (sub - discount) * 0.1,
    total = Math.round(sub - discount + vat);
  const products = db.map((p) => {
    const c = cart.find((x) => x.id === p.id);
    return c
      ? {
          ...p,
          quantity: p.quantity - c.qty,
          status:
            p.quantity - c.qty <= 0
              ? "Out of Stock"
              : p.quantity - c.qty <= p.reorder
                ? "Low Stock"
                : "In Stock",
        }
      : p;
  });
  saveCollection("products", products);
  const orders = getCollection("orders");
  orders.unshift({
    id: 1000 + nextId(orders),
    customer: "Walk-in Customer",
    items: cart.reduce((s, x) => s + x.qty, 0),
    total,
    status: "Paid",
    date: new Date().toISOString().slice(0, 10),
  });
  saveCollection("orders", orders);
  notify("Sale completed", `Order total ৳${total.toLocaleString()}`, "success");
  cart = [];
  toast("Sale completed successfully.");
  render();
}
