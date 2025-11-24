// Telegram WebApp API
let tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
    tg.expand();
    document.body.classList.add("telegram");
}

// ---------------------------
//   ПЕРЕМЕННЫЕ
// ---------------------------
let productsNew = [];
let productsUsed = [];
let cart = [];

// ---------------------------
//   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ---------------------------
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

// ---------------------------
//   РЕНДЕР КАТАЛОГА
// ---------------------------
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

    if (!filtered.length) {
        const empty = document.createElement("p");
        empty.textContent = "Ничего не найдено";
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
            ? (p.state ?? "Б/У")
            : (p.desc ?? "");

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

// ---------------------------
//   КОРЗИНА
// ---------------------------
function addToCart(product, isUsed) {
    const existing = cart.find(i => i.id === product.id);

    if (existing) {
        existing.qty++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            qty: 1,
            price: Number(product.price) || 0,
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
        list.innerHTML = "<p style='color:#6b7280;font-size:13px;'>Корзина пуста</p>";
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

        // Количество
        const qty = document.createElement("div");
        qty.className = "cart-qty";

        const minus = document.createElement("button");
        minus.textContent = "−";

        const plus = document.createElement("button");
        plus.textContent = "+";

        const qtyValue = document.createElement("span");
        qtyValue.textContent = item.qty;

        minus.onclick = () => {
            item.qty--;
            if (item.qty <= 0) {
                cart = cart.filter(i => i.id !== item.id);
            }
            renderCart();
            updateCartBadge();
        };

        plus.onclick = () => {
            item.qty++;
            renderCart();
            updateCartBadge();
        };

        qty.append(minus, qtyValue, plus);

        const price = document.createElement("div");
        price.className = "product-price";
        price.textContent = formatPrice(item.price * item.qty);

        bottom.append(qty, price);
        info.append(name, meta, bottom);
        row.append(info);
        list.append(row);
    });

    totalEl.textContent = formatPrice(total);
    updateCartBadge();
}

// ---------------------------
//   ПОИСК И ФИЛЬТРЫ
// ---------------------------
function setupCatalogControls() {
    const searchNew = document.getElementById("search-new");
    const filterNew = document.getElementById("brand-filters-new");
    let brandNew = "all";

    const searchUsed = document.getElementById("search-used");
    const filterUsed = document.getElementById("brand-filters-used");
    let brandUsed = "all";

    function updNew() {
        renderCatalog("new-list", productsNew, searchNew.value, brandNew, false);
    }

    function updUsed() {
        renderCatalog("used-list", productsUsed, searchUsed.value, brandUsed, true);
    }

    if (searchNew) searchNew.oninput = updNew;
    if (searchUsed) searchUsed.oninput = updUsed;

    if (filterNew)
        filterNew.onclick = e => {
            if (e.target.classList.contains("brand-btn")) {
                filterNew.querySelectorAll(".brand-btn").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                brandNew = e.target.dataset.brand;
                updNew();
            }
        };

    if (filterUsed)
        filterUsed.onclick = e => {
            if (e.target.classList.contains("brand-btn")) {
                filterUsed.querySelectorAll(".brand-btn").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                brandUsed = e.target.dataset.brand;
                updUsed();
            }
        };

    updNew();
    updUsed();
}

// ---------------------------
//   ЗАГРУЗКА ТОВАРОВ
// ---------------------------
async function loadProducts() {
    try {
        const [newR, usedR] = await Promise.all([
            fetch("products_new.json"),
            fetch("products_used.json")
        ]);

        productsNew = await newR.json();
        productsUsed = await usedR.json();
    } catch (e) {
        console.error("Ошибка загрузки товаров", e);
        productsNew = [];
        productsUsed = [];
    }

    setupCatalogControls();
}

// ---------------------------
//   ОФОРМЛЕНИЕ ЗАКАЗА
// ---------------------------
const submitOrderBtn = document.getElementById("submit-order-btn");

if (submitOrderBtn) {
    submitOrderBtn.addEventListener("click", () => {

        if (!cart.length) {
            alert("Корзина пуста");
            return;
        }

        const name = document.getElementById("order-name").value.trim();
        const phone = document.getElementById("order-phone").value.trim();
        const contact_method = document.getElementById("order-contact-method").value;
        const delivery_type = document.getElementById("order-delivery-type").value;
        const delivery_cost = parseInt((document.getElementById("order-delivery-cost").value || "").replace(/\s/g, "")) || 0;
        const address = document.getElementById("order-address").value.trim();
        const comment = document.getElementById("order-comment").value.trim();

        if (!name || !phone) {
            alert("Введите имя и телефон");
            return;
        }

        const payload = {
            items: cart,
            total: getCartTotal(),
            name,
            phone,
            contact_method,
            delivery_type,
            delivery_cost,
            address,
            comment
        };

        // ------------------------
        //    ОТПРАВКА В TELEGRAM
        // ------------------------
        if (tg) {
            tg.sendData(JSON.stringify(payload));
            console.log("SEND DATA:", payload);
        } else {
            alert("Ошибка: Telegram WebApp не инициализирован");
            return;
        }

        alert("Ваш заказ отправлен менеджеру 🙌");

        cart = [];
        renderCart();
        updateCartBadge();
        showPage("new");
    });
}

// ---------------------------
//   НАВИГАЦИЯ
// ---------------------------
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.onclick = () => showPage(btn.dataset.page);
});

// ---------------------------
//   ЗАПУСК
// ---------------------------
showPage("new");
loadProducts();
updateCartBadge();
