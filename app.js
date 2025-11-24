// ===============================
//   Telegram WebApp init
// ===============================
const tg = window.Telegram.WebApp;
if (tg) {
    tg.expand();
    document.body.classList.add("telegram");
}

// ===============================
//   ДАННЫЕ
// ===============================
let productsNew = [];
let productsUsed = [];
let cart = [];

// ===============================
//   УТИЛИТЫ
// ===============================
function showPage(page) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById("page-" + page).style.display = "block";

    document.querySelectorAll(".nav-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.page === page)
    );

    if (page === "cart") renderCart();
}

function formatPrice(num) {
    return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
}

function cartTotal() {
    return cart.reduce((t, i) => t + i.price * i.qty, 0);
}

function cartCount() {
    return cart.reduce((t, i) => t + i.qty, 0);
}

function updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    const count = cartCount();

    if (count > 0) {
        badge.style.display = "inline-flex";
        badge.textContent = count;
    } else {
        badge.style.display = "none";
    }
}

// ===============================
//   КАТАЛОГ
// ===============================
function renderCatalog(target, products, search, brand, used) {
    const list = document.getElementById(target);
    list.innerHTML = "";

    const q = search.toLowerCase();
    const items = products.filter(p =>
        p.name.toLowerCase().includes(q) &&
        (brand === "all" ? true :
         brand === "other"
            ? !["iPhone", "Samsung", "Xiaomi", "Honor", "Realme", "Vivo"].includes(p.brand)
            : p.brand === brand)
    );

    if (!items.length) {
        list.innerHTML = `<p style="color:#888;font-size:13px;">Ничего не найдено</p>`;
        return;
    }

    items.forEach(p => {
        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
            <img class="product-image" src="${p.image}">
            <div class="product-info">
                <div class="product-name">${p.name}</div>
                <div class="product-meta">${used ? "Б/У" : (p.desc || "")}</div>
                <div class="product-bottom">
                    <div class="product-price">${formatPrice(p.price)}</div>
                    <button class="add-btn"><span>Добавить</span></button>
                </div>
            </div>`;
        div.querySelector("button").onclick = () => addToCart(p, used);
        list.appendChild(div);
    });
}

// ===============================
//   КОРЗИНА
// ===============================
function addToCart(product, used) {
    const ex = cart.find(i => i.id === product.id);
    if (ex) ex.qty += 1;
    else cart.push({ ...product, qty: 1, isUsed: used });

    renderCart();
    updateCartBadge();
}

function renderCart() {
    const list = document.getElementById("cart-list");
    const totalEl = document.getElementById("cart-total");
    list.innerHTML = "";

    if (!cart.length) {
        list.innerHTML = `<p style="color:#666;">Корзина пуста</p>`;
        totalEl.textContent = "0 ₽";
        updateCartBadge();
        return;
    }

    cart.forEach(item => {
        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-meta">${item.isUsed ? "Б/У" : "Новый"}</div>
                <div class="cart-item-bottom">
                    <div class="cart-qty">
                        <button class="minus">-</button>
                        <span>${item.qty}</span>
                        <button class="plus">+</button>
                    </div>
                    <div class="product-price">${formatPrice(item.price * item.qty)}</div>
                </div>
            </div>`;

        row.querySelector(".minus").onclick = () => {
            item.qty--;
            if (item.qty <= 0) cart = cart.filter(i => i.id !== item.id);
            renderCart();
            updateCartBadge();
        };

        row.querySelector(".plus").onclick = () => {
            item.qty++;
            renderCart();
            updateCartBadge();
        };

        list.appendChild(row);
    });

    totalEl.textContent = formatPrice(cartTotal());
}

// ===============================
//   ЗАКАЗ
// ===============================
function recalcTotals() {
    const products = cartTotal();
    const delivery = Number(document.getElementById("order-delivery-cost").value || 0);

    document.getElementById("checkout-products-sum").textContent = formatPrice(products);
    document.getElementById("checkout-delivery-sum").textContent = formatPrice(delivery);
    document.getElementById("checkout-total-sum").textContent = formatPrice(products + delivery);
}

document.getElementById("checkout-btn").onclick = () => {
    if (!cart.length) return alert("Корзина пуста");
    recalcTotals();
    showPage("checkout");
};

document.getElementById("order-delivery-cost").oninput = recalcTotals;

// ===============================
//   ОТПРАВКА ЗАКАЗА
// ===============================
document.getElementById("submit-order-btn").onclick = () => {
    if (!cart.length) return alert("Корзина пуста");

    const name = document.getElementById("order-name").value.trim();
    const phone = document.getElementById("order-phone").value.trim();

    if (!name || !phone) return alert("Введите имя и телефон");

    const payload = {
        items: cart,
        total: cartTotal(),
        name,
        phone,
        contact_method: document.getElementById("order-contact-method").value,
        delivery_type: document.getElementById("order-delivery-type").value,
        delivery_cost: Number(document.getElementById("order-delivery-cost").value) || 0,
        address: document.getElementById("order-address").value.trim(),
        comment: document.getElementById("order-comment").value.trim()
    };

    console.log("SEND DATA:", payload);

    if (tg) tg.sendData(JSON.stringify(payload));

    alert("Заказ отправлен! Мы скоро свяжемся 🙌");

    cart = [];
    updateCartBadge();
    showPage("new");
};

// ===============================
//   ЗАГРУЗКА ТОВАРОВ
// ===============================
async function loadProducts() {
    try {
        const n = await fetch("products_new.json").then(r => r.json());
        const u = await fetch("products_used.json").then(r => r.json());

        productsNew = n;
        productsUsed = u;
    } catch (e) {
        console.error("Ошибка загрузки товаров:", e);
    }

    setupCatalogControls();
}

function setupCatalogControls() {
    let brandNew = "all";
    let brandUsed = "all";

    // Новые
    document.getElementById("search-new").oninput = () =>
        renderCatalog("new-list", productsNew, searchNew.value, brandNew, false);

    document.getElementById("brand-filters-new").onclick = e => {
        if (!e.target.dataset.brand) return;
        brandNew = e.target.dataset.brand;
        document.querySelectorAll("#brand-filters-new .brand-btn")
            .forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        renderCatalog("new-list", productsNew, searchNew.value, brandNew, false);
    };

    // Б/У
    document.getElementById("search-used").oninput = () =>
        renderCatalog("used-list", productsUsed, searchUsed.value, brandUsed, true);

    document.getElementById("brand-filters-used").onclick = e => {
        if (!e.target.dataset.brand) return;
        brandUsed = e.target.dataset.brand;
        document.querySelectorAll("#brand-filters-used .brand-btn")
            .forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        renderCatalog("used-list", productsUsed, searchUsed.value, brandUsed, true);
    };

    // Первичная отрисовка
    renderCatalog("new-list", productsNew, "", "all", false);
    renderCatalog("used-list", productsUsed, "", "all", true);
}

// ===============================
//   СТАРТ
// ===============================
showPage("new");
loadProducts();
updateCartBadge();
