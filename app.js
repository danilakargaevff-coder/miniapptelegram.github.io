// ==============================
//  Telegram WebApp API
// ==============================
const tg = window.Telegram.WebApp;
tg.expand();

// ==============================
//  Глобальные переменные
// ==============================
let productsNew = [];
let productsUsed = [];
let cart = [];

// ==============================
//  Переход между страницами
// ==============================
function showPage(name) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById("page-" + name).style.display = "block";

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.page === name);
    });

    if (name === "cart") renderCart();
}

// ==============================
//  Форматирование цен
// ==============================
function formatPrice(n) {
    n = Number(n) || 0;
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
}

// ==============================
//  Корзина
// ==============================
function getCartTotal() {
    return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function getCartCount() {
    return cart.reduce((s, i) => s + i.qty, 0);
}

function updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    const c = getCartCount();
    badge.textContent = c;
    badge.style.display = c > 0 ? "inline-flex" : "none";
}

function addToCart(p, isUsed) {
    const ex = cart.find(i => i.id === p.id);
    if (ex) ex.qty++;
    else cart.push({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        qty: 1,
        isUsed,
        brand: p.brand
    });

    updateCartBadge();
    renderCart();
}

function renderCart() {
    const list = document.getElementById("cart-list");
    const totalEl = document.getElementById("cart-total");

    list.innerHTML = "";

    if (cart.length === 0) {
        list.innerHTML = "<p style='color:#666'>Корзина пока пуста.</p>";
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
                        <button class="minus">−</button>
                        <span>${item.qty}</span>
                        <button class="plus">+</button>
                    </div>
                    <div class="product-price">${formatPrice(item.price * item.qty)}</div>
                </div>
            </div>
        `;

        row.querySelector(".minus").addEventListener("click", () => {
            item.qty--;
            if (item.qty <= 0) cart = cart.filter(i => i.id !== item.id);
            renderCart();
            updateCartBadge();
        });

        row.querySelector(".plus").addEventListener("click", () => {
            item.qty++;
            renderCart();
            updateCartBadge();
        });

        list.appendChild(row);
    });

    totalEl.textContent = formatPrice(getCartTotal());
}

// ==============================
//  Каталоги
// ==============================
function renderCatalog(id, arr, query, brand, isUsed) {
    const list = document.getElementById(id);
    list.innerHTML = "";

    query = query.toLowerCase();

    const filtered = arr.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(query);
        const matchBrand =
            brand === "all"
                ? true
                : brand === "other"
                    ? !["iPhone","Samsung","Xiaomi","Honor","Realme","Vivo"].includes(p.brand)
                    : p.brand === brand;

        return matchSearch && matchBrand;
    });

    filtered.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
            <img class="product-image" src="${p.image}">
            <div class="product-info">
                <div class="product-name">${p.name}</div>
                <div class="product-meta">${isUsed ? (p.state || p.desc || "Б/У") : (p.desc || "")}</div>
                <div class="product-bottom">
                    <div class="product-price">${formatPrice(p.price)}</div>
                    <button class="add-btn"><span>Добавить</span></button>
                </div>
            </div>
        `;

        card.querySelector(".add-btn").addEventListener("click", () => addToCart(p, isUsed));

        list.appendChild(card);
    });
}

function setupCatalogControls() {
    // Новые
    const searchNew = document.getElementById("search-new");
    const filtersNew = document.getElementById("brand-filters-new");
    let brandNew = "all";

    function update() {
        renderCatalog("new-list", productsNew, searchNew.value, brandNew, false);
    }

    searchNew.addEventListener("input", update);

    filtersNew.addEventListener("click", e => {
        if (e.target.classList.contains("brand-btn")) {
            filtersNew.querySelectorAll(".brand-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            brandNew = e.target.dataset.brand;
            update();
        }
    });

    // Б/У
    const searchUsed = document.getElementById("search-used");
    const filtersUsed = document.getElementById("brand-filters-used");
    let brandUsed = "all";

    function updateUsed() {
        renderCatalog("used-list", productsUsed, searchUsed.value, brandUsed, true);
    }

    searchUsed.addEventListener("input", updateUsed);

    filtersUsed.addEventListener("click", e => {
        if (e.target.classList.contains("brand-btn")) {
            filtersUsed.querySelectorAll(".brand-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            brandUsed = e.target.dataset.brand;
            updateUsed();
        }
    });

    update();
    updateUsed();
}

// ==============================
//  Оформление заказа
// ==============================
document.getElementById("checkout-btn").addEventListener("click", () => {
    if (cart.length === 0) {
        tg.showAlert("Корзина пуста");
        return;
    }
    recalcCheckoutTotals();
    showPage("checkout");
});

function recalcCheckoutTotals() {
    const goods = getCartTotal();
    const del = Number(document.getElementById("order-delivery-cost").value || 0);

    document.getElementById("checkout-products-sum").textContent = formatPrice(goods);
    document.getElementById("checkout-delivery-sum").textContent = formatPrice(del);
    document.getElementById("checkout-total-sum").textContent = formatPrice(goods + del);
}

document.getElementById("order-delivery-cost").addEventListener("input", recalcCheckoutTotals);

document.getElementById("submit-order-btn").addEventListener("click", () => {
    if (cart.length === 0) {
        tg.showAlert("Корзина пуста");
        return;
    }

    const name = document.getElementById("order-name").value.trim();
    const phone = document.getElementById("order-phone").value.trim();

    if (!name || !phone) {
        tg.showAlert("Укажите имя и телефон");
        return;
    }

    const payload = {
        items: cart,
        total: getCartTotal(),
        name,
        phone,
        contact_method: document.getElementById("order-contact-method").value,
        delivery_type: document.getElementById("order-delivery-type").value,
        delivery_cost: Number(document.getElementById("order-delivery-cost").value || 0),
        address: document.getElementById("order-address").value.trim(),
        comment: document.getElementById("order-comment").value.trim()
    };

    tg.sendData(JSON.stringify(payload));
    tg.close();
});

// ==============================
//  Навигация
// ==============================
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
});

// ==============================
//  Старт
// ==============================
async function loadProducts() {
    productsNew = await (await fetch("products_new.json")).json();
    productsUsed = await (await fetch("products_used.json")).json();
    setupCatalogControls();
}

showPage("new");
loadProducts();
updateCartBadge();
