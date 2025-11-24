// ---------------------------------------------------------
// Telegram WebApp API
// ---------------------------------------------------------
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) {
    tg.expand();
    document.body.classList.add("telegram");
}

// ---------------------------------------------------------
// Глобальные переменные
// ---------------------------------------------------------
let productsNew = [];
let productsUsed = [];
let cart = [];

// ---------------------------------------------------------
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ---------------------------------------------------------
function showPage(pageName) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const page = document.getElementById("page-" + pageName);
    if (page) page.style.display = "block";
}

function formatPrice(num) {
    num = Number(num) || 0;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge) return;
    const count = getCartCount();
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = "inline-flex";
    } else {
        badge.style.display = "none";
    }
}

// ---------------------------------------------------------
// КАТАЛОГ ТОВАРОВ
// ---------------------------------------------------------
function renderCatalog(listElementId, items, searchValue, brandFilter, isUsed) {
    const listEl = document.getElementById(listElementId);
    listEl.innerHTML = "";

    const query = (searchValue || "").toLowerCase();
    const brand = brandFilter || "all";

    const filtered = items.filter(p => {
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesBrand =
            brand === "all" ? true :
            brand === "other"
                ? !["iPhone", "Samsung", "Xiaomi", "Honor", "Realme", "Vivo"].includes(p.brand)
                : p.brand === brand;

        return matchesName && matchesBrand;
    });

    if (!filtered.length) {
        listEl.innerHTML = "<p style='font-size:13px;color:#6b7280;'>Ничего не найдено.</p>";
        return;
    }

    filtered.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
            <img src="${p.image}" class="product-image">
            <div class="product-info">
                <div class="product-name">${p.name}</div>
                <div class="product-meta">${isUsed ? "Б/У" : (p.desc || "")}</div>
                <div class="product-bottom">
                    <div class="product-price">${formatPrice(p.price)}</div>
                    <button class="add-btn">Добавить</button>
                </div>
            </div>
        `;

        card.querySelector(".add-btn").addEventListener("click", () => addToCart(p, isUsed));
        listEl.appendChild(card);
    });
}

// ---------------------------------------------------------
// КОРЗИНА
// ---------------------------------------------------------
function addToCart(product, isUsed) {
    const existing = cart.find(i => i.id === product.id);

    if (existing) {
        existing.qty++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price) || 0,
            qty: 1,
            brand: product.brand,
            isUsed: !!isUsed
        });
    }

    renderCart();
    updateCartBadge();
}

function renderCart() {
    const list = document.getElementById("cart-list");
    const totalEl = document.getElementById("cart-total");

    list.innerHTML = "";
    if (!cart.length) {
        list.innerHTML = "<p style='font-size:13px;color:#6b7280;'>Корзина пуста</p>";
        totalEl.textContent = "0 ₽";
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

        row.querySelector(".minus").onclick = () => {
            item.qty--;
            if (!item.qty) cart = cart.filter(i => i.id !== item.id);
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

    totalEl.textContent = formatPrice(getCartTotal());
}

// ---------------------------------------------------------
// ОФОРМЛЕНИЕ ЗАКАЗА
// ---------------------------------------------------------
document.getElementById("checkout-btn")?.addEventListener("click", () => {
    if (!cart.length) {
        alert("Корзина пуста");
        return;
    }
    recalcCheckoutTotals();
    showPage("checkout");
});

function recalcCheckoutTotals() {
    const products = getCartTotal();
    const delivery = parseInt((document.getElementById("order-delivery-cost").value || "0").replace(/\s/g, "")) || 0;

    document.getElementById("checkout-products-sum").textContent = formatPrice(products);
    document.getElementById("checkout-delivery-sum").textContent = formatPrice(delivery);
    document.getElementById("checkout-total-sum").textContent = formatPrice(products + delivery);
}

document.getElementById("order-delivery-cost")?.addEventListener("input", recalcCheckoutTotals);

// ---------------------------------------------------------
// ОТПРАВКА ЗАКАЗА В TELEGRAM
// ---------------------------------------------------------
document.getElementById("submit-order-btn")?.addEventListener("click", () => {
    if (!cart.length) {
        alert("Корзина пуста");
        return;
    }

    const name = document.getElementById("order-name").value.trim();
    const phone = document.getElementById("order-phone").value.trim();

    if (!name || !phone) {
        alert("Введите имя и телефон");
        return;
    }

    const payload = {
        items: cart.map(i => ({
            name: i.name,
            qty: i.qty,
            price: i.price,
            brand: i.brand,
            isUsed: i.isUsed
        })),
        total: getCartTotal(),
        name,
        phone,
        contact_method: document.getElementById("order-contact-method").value,
        delivery_type: document.getElementById("order-delivery-type").value,
        delivery_cost: parseInt((document.getElementById("order-delivery-cost").value || 0)) || 0,
        address: document.getElementById("order-address").value.trim(),
        comment: document.getElementById("order-comment").value.trim()
    };

    if (tg) {
        tg.sendData(JSON.stringify(payload));

        console.log("SEND DATA:", payload);
        alert("sendData выполнен! WebApp → бот OK");
    }

    cart = [];
    renderCart();
    updateCartBadge();
    showPage("new");
    alert("Заказ отправлен 🙌");
});

// ---------------------------------------------------------
// НАВИГАЦИЯ И СТАРТ
// ---------------------------------------------------------
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.onclick = () => showPage(btn.dataset.page);
});

showPage("new");
loadProducts();
updateCartBadge();

// ---------------------------------------------------------
// ЗАГРУЗКА JSON ТОВАРОВ
// ---------------------------------------------------------
async function loadProducts() {
    try {
        const [n, u] = await Promise.all([
            fetch("products_new.json"),
            fetch("products_used.json")
        ]);
        productsNew = await n.json();
        productsUsed = await u.json();
    } catch (e) {
        console.error("Ошибка загрузки JSON", e);
    }

    renderCatalog("new-list", productsNew, "", "all", false);
    renderCatalog("used-list", productsUsed, "", "all", true);
}
