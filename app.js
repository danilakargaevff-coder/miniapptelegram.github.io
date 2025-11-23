// Telegram WebApp
let tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
    tg.expand();
    document.body.classList.add("telegram");
}

let productsNew = [];
let productsUsed = [];
let cart = [];

// ----- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ -----

function showPage(pageName) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const page = document.getElementById("page-" + pageName);
    if (page) page.style.display = "block";

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.page === pageName);
    });

    if (pageName === "cart") {
        renderCart();
    }
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

// ----- РИСОВАНИЕ КАТАЛОГОВ -----

function renderCatalog(listElementId, products, searchValue, brandFilter, isUsed) {
    const listEl = document.getElementById(listElementId);
    listEl.innerHTML = "";

    const query = (searchValue || "").toLowerCase();
    const brand = brandFilter || "all";

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(query);
        const matchesBrand =
            brand === "all"
                ? true
                : brand === "other"
                    ? !["iPhone", "Samsung", "Xiaomi", "Honor", "Realme", "Vivo"].includes(p.brand)
                    : p.brand === brand;

        return matchesSearch && matchesBrand;
    });

    if (filtered.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "Ничего не найдено. Попробуйте изменить запрос или фильтр.";
        empty.style.fontSize = "13px";
        empty.style.color = "#6b7280";
        listEl.appendChild(empty);
        return;
    }

    filtered.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";

        const img = document.createElement("img");
        img.className = "product-image";
        img.src = p.image || "";
        img.alt = p.name;

        const info = document.createElement("div");
        info.className = "product-info";

        const name = document.createElement("div");
        name.className = "product-name";
        name.textContent = p.name;

        const meta = document.createElement("div");
        meta.className = "product-meta";
        meta.textContent = isUsed
            ? (p.state ? `Состояние: ${p.state}` : (p.desc || "Б/У"))
            : (p.desc || "");

        const bottom = document.createElement("div");
        bottom.className = "product-bottom";

        const price = document.createElement("div");
        price.className = "product-price";
        price.textContent = formatPrice(p.price);

        const btn = document.createElement("button");
        btn.className = "add-btn";
        btn.innerHTML = "<span>Добавить</span>";

        btn.addEventListener("click", () => addToCart(p, isUsed));

        bottom.appendChild(price);
        bottom.appendChild(btn);

        info.appendChild(name);
        info.appendChild(meta);
        info.appendChild(bottom);

        card.appendChild(img);
        card.appendChild(info);

        listEl.appendChild(card);
    });
}

// ----- КОРЗИНА -----

function addToCart(product, isUsed) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price) || 0,
            brand: product.brand,
            isUsed: !!isUsed,
            qty: 1
        });
    }
    renderCart();
    updateCartBadge();
}

function renderCart() {
    const list = document.getElementById("cart-list");
    const totalEl = document.getElementById("cart-total");
    list.innerHTML = "";

    if (cart.length === 0) {
        list.innerHTML = "<p style='font-size:13px;color:#6b7280;'>Корзина пока пуста.</p>";
        totalEl.textContent = "0 ₽";
        updateCartBadge();
        return;
    }

    let total = 0;

    cart.forEach(item => {
        total += item.price * item.qty;

        const row = document.createElement("div");
        row.className = "cart-item";

        const info = document.createElement("div");
        info.className = "cart-item-info";

        const name = document.createElement("div");
        name.className = "cart-item-name";
        name.textContent = item.name;

        const meta = document.createElement("div");
        meta.className = "cart-item-meta";
        meta.textContent = item.isUsed ? "Б/У" : "Новый";

        const bottom = document.createElement("div");
        bottom.className = "cart-item-bottom";

        const qty = document.createElement("div");
        qty.className = "cart-qty";

        const minus = document.createElement("button");
        minus.textContent = "−";

        const plus = document.createElement("button");
        plus.textContent = "+";

        const qtyValue = document.createElement("span");
        qtyValue.textContent = item.qty;

        minus.addEventListener("click", () => {
            item.qty -= 1;
            if (item.qty <= 0) {
                cart = cart.filter(i => i.id !== item.id);
            }
            renderCart();
            updateCartBadge();
        });

        plus.addEventListener("click", () => {
            item.qty += 1;
            renderCart();
            updateCartBadge();
        });

        qty.appendChild(minus);
        qty.appendChild(qtyValue);
        qty.appendChild(plus);

        const price = document.createElement("div");
        price.className = "product-price";
        price.textContent = formatPrice(item.price * item.qty);

        bottom.appendChild(qty);
        bottom.appendChild(price);

        info.appendChild(name);
        info.appendChild(meta);
        info.appendChild(bottom);

        row.appendChild(info);
        list.appendChild(row);
    });

    totalEl.textContent = formatPrice(total);
    updateCartBadge();
}

// ----- ПОИСК И ФИЛЬТРЫ -----

function setupCatalogControls() {
    // НОВЫЕ
    const searchNew = document.getElementById("search-new");
    const filterNewBlock = document.getElementById("brand-filters-new");
    let newBrand = "all";

    function updateNew() {
        renderCatalog("new-list", productsNew, searchNew.value, newBrand, false);
    }

    if (searchNew) {
        searchNew.addEventListener("input", updateNew);
    }

    if (filterNewBlock) {
        filterNewBlock.addEventListener("click", (e) => {
            if (e.target.classList.contains("brand-btn")) {
                filterNewBlock.querySelectorAll(".brand-btn").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                newBrand = e.target.dataset.brand;
                updateNew();
            }
        });
    }

    // Б/У
    const searchUsed = document.getElementById("search-used");
    const filterUsedBlock = document.getElementById("brand-filters-used");
    let usedBrand = "all";

    function updateUsed() {
        renderCatalog("used-list", productsUsed, searchUsed.value, usedBrand, true);
    }

    if (searchUsed) {
        searchUsed.addEventListener("input", updateUsed);
    }

    if (filterUsedBlock) {
        filterUsedBlock.addEventListener("click", (e) => {
            if (e.target.classList.contains("brand-btn")) {
                filterUsedBlock.querySelectorAll(".brand-btn").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                usedBrand = e.target.dataset.brand;
                updateUsed();
            }
        });
    }

    updateNew();
    updateUsed();
}

// ----- ЗАГРУЗКА ТОВАРОВ ИЗ JSON -----

async function loadProducts() {
    try {
        const [newRes, usedRes] = await Promise.all([
            fetch("products_new.json"),
            fetch("products_used.json")
        ]);

        productsNew = await newRes.json();
        productsUsed = await usedRes.json();
    } catch (e) {
        console.error("Ошибка загрузки товаров", e);
        productsNew = [];
        productsUsed = [];
    }

    setupCatalogControls();
}

// ----- ОФОРМЛЕНИЕ ЗАКАЗА -----

const checkoutBtn = document.getElementById("checkout-btn");
const submitOrderBtn = document.getElementById("submit-order-btn");

function recalcCheckoutTotals() {
    const productsTotal = getCartTotal();
    const deliveryInput = document.getElementById("order-delivery-cost");
    let delivery = 0;
    if (deliveryInput) {
        const raw = (deliveryInput.value || "").replace(/\s/g, "");
        delivery = parseInt(raw, 10) || 0;
    }
    const productsSpan = document.getElementById("checkout-products-sum");
    const deliverySpan = document.getElementById("checkout-delivery-sum");
    const totalSpan = document.getElementById("checkout-total-sum");

    if (productsSpan) productsSpan.textContent = formatPrice(productsTotal);
    if (deliverySpan) deliverySpan.textContent = formatPrice(delivery);
    if (totalSpan) totalSpan.textContent = formatPrice(productsTotal + delivery);
}

if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        if (cart.length === 0) {
            alert("Корзина пуста");
            return;
        }
        recalcCheckoutTotals();
        showPage("checkout");
    });
}

const deliveryInput = document.getElementById("order-delivery-cost");
if (deliveryInput) {
    deliveryInput.addEventListener("input", () => {
        recalcCheckoutTotals();
    });
}

if (submitOrderBtn) {
    submitOrderBtn.addEventListener("click", () => {
        if (cart.length === 0) {
            alert("Корзина пуста");
            return;
        }

        const nameEl = document.getElementById("order-name");
        const phoneEl = document.getElementById("order-phone");
        const contactEl = document.getElementById("order-contact-method");
        const deliveryTypeEl = document.getElementById("order-delivery-type");
        const deliveryCostEl = document.getElementById("order-delivery-cost");
        const addressEl = document.getElementById("order-address");
        const commentEl = document.getElementById("order-comment");

        const name = nameEl.value.trim();
        const phone = phoneEl.value.trim();

        if (!name || !phone) {
            alert("Пожалуйста, укажите имя и телефон.");
            return;
        }

        const contact_method = contactEl.value;
        const delivery_type = deliveryTypeEl.value;
        const delivery_cost = parseInt((deliveryCostEl.value || "").replace(/\s/g, ""), 10) || 0;
        const address = addressEl.value.trim();
        const comment = commentEl.value.trim();

        const total = getCartTotal();

        const payload = {
            items: cart.map(item => ({
                name: item.name,
                qty: item.qty,
                price: item.price,
                isUsed: item.isUsed,
                brand: item.brand
            })),
            total: total,
            name,
            phone,
            contact_method,
            delivery_type,
            delivery_cost,
            address,
            comment
        };

        if (tg) {
            tg.sendData(JSON.stringify(payload));
        } else {
            alert("Для теста:\n" + JSON.stringify(payload, null, 2));
        }

        cart = [];
        renderCart();
        updateCartBadge();
        showPage("new");
        alert("Заказ отправлен, мы скоро с вами свяжемся 🙌");
    });
}

// ----- НАВИГАЦИЯ ВНИЗУ -----

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const page = btn.dataset.page;
        showPage(page);
    });
});

// ----- СТАРТ -----

showPage("new");
loadProducts();
updateCartBadge();
