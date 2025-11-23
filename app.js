// Telegram WebApp
let tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
    tg.expand();
    document.body.classList.add("telegram");
}

// Пустые массивы — заполним их из JSON
let productsNew = [];
let productsUsed = [];

// КОРЗИНА
let cart = [];

// Показ страницы
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

// Формат цены 70500 -> "70 500 ₽"
function formatPrice(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
}

// РЕНДЕР КАТАЛОГОВ

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
        empty.textContent = "Ничего не найдено. Попробуйте изменить запрос.";
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
            ? `Состояние: ${p.state || "Б/У"}`
            : p.desc;

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

// ДОБАВЛЕНИЕ В КОРЗИНУ

function addToCart(product, isUsed) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            brand: product.brand,
            isUsed: !!isUsed,
            qty: 1
        });
    }
    renderCart();
}

// РЕНДЕР КОРЗИНЫ

function renderCart() {
    const list = document.getElementById("cart-list");
    const totalEl = document.getElementById("cart-total");
    list.innerHTML = "";

    if (cart.length === 0) {
        list.innerHTML = "<p style='font-size:13px;color:#6b7280;'>Корзина пока пуста.</p>";
        totalEl.textContent = "0 ₽";
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
        });

        plus.addEventListener("click", () => {
            item.qty += 1;
            renderCart();
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
}

// ПОИСК И ФИЛЬТРЫ

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

    // начальный рендер
    updateNew();
    updateUsed();
}

// ЗАГРУЗКА ТОВАРОВ ИЗ JSON

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

// ОБРАБОТЧИКИ ВКЛАДОК

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const page = btn.dataset.page;
        showPage(page);
    });
});

// ОФОРМЛЕНИЕ ЗАКАЗА

const checkoutBtn = document.getElementById("checkout-btn");
if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        if (cart.length === 0) {
            alert("Корзина пуста");
            return;
        }
        const payload = {
            items: cart,
            total: cart.reduce((sum, item) => sum + item.price * item.qty, 0)
        };

        if (tg) {
            tg.sendData(JSON.stringify(payload));
        } else {
            alert("Данные заказа (для теста):\n" + JSON.stringify(payload, null, 2));
        }
    });
}

// Запуск
showPage("new");      // при старте – каталог новых
loadProducts();
