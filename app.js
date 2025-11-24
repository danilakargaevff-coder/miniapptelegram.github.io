// ================================
//     TELEGRAM WEBAPP INIT
// ================================
let tg = window.Telegram?.WebApp || null;

if (tg) {
    tg.expand();
    tg.enableClosingConfirmation();
}

// ================================
//     DATA
// ================================
let cart = [];
let productsNew = [];
let productsUsed = [];

// ================================
//     VIEW HELPERS
// ================================
function showPage(page) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById("page-" + page).style.display = "block";

    document.querySelectorAll(".nav-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.page === page)
    );

    if (page === "cart") renderCart();
}

function formatPrice(num) {
    return Number(num).toLocaleString("ru-RU") + " ₽";
}

function updateBadge() {
    const badge = document.getElementById("cart-badge");
    const count = cart.reduce((s, i) => s + i.qty, 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline-block" : "none";
}

// ================================
//        LOAD PRODUCTS
// ================================
async function loadProducts() {
    try {
        let newRes = await fetch("products_new.json");
        let usedRes = await fetch("products_used.json");

        productsNew = await newRes.json();
        productsUsed = await usedRes.json();
    } catch (e) {
        console.error("Ошибка загрузки:", e);
    }

    renderCatalog("new-list", productsNew, false);
    renderCatalog("used-list", productsUsed, true);
}

// ================================
//        RENDER CATALOG
// ================================
function renderCatalog(listID, items, isUsed) {
    const list = document.getElementById(listID);
    list.innerHTML = "";

    items.forEach(p => {
        const el = document.createElement("div");
        el.className = "product-card";
        el.innerHTML = `
            <img src="${p.image}" class="product-image">
            <div class="product-info">
                <div class="product-name">${p.name}</div>
                <div class="product-meta">${isUsed ? "Б/У" : p.desc || ""}</div>

                <div class="product-bottom">
                    <div class="product-price">${formatPrice(p.price)}</div>
                    <button class="add-btn">Добавить</button>
                </div>
            </div>
        `;

        el.querySelector(".add-btn").onclick = () => addToCart(p, isUsed);
        list.appendChild(el);
    });
}

// ================================
//        CART
// ================================
function addToCart(item, used) {
    let ex = cart.find(i => i.id === item.id);

    if (ex) ex.qty++;
    else
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            isUsed: used,
            brand: item.brand,
            qty: 1
        });

    renderCart();
    updateBadge();
}

function renderCart() {
    const list = document.getElementById("cart-items");
    const total = document.getElementById("cart-sum");
    list.innerHTML = "";

    if (cart.length === 0) {
        list.innerHTML = `<p style="color:#666;">Корзина пустая</p>`;
        total.textContent = "0 ₽";
        return;
    }

    let sum = 0;

    cart.forEach(i => {
        sum += i.qty * i.price;

        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${i.name}</div>
                <div class="cart-item-meta">${i.isUsed ? "Б/У" : "Новый"}</div>

                <div class="cart-item-bottom">
                    <div class="cart-qty">
                        <button class="minus">-</button>
                        <span>${i.qty}</span>
                        <button class="plus">+</button>
                    </div>

                    <div class="product-price">${formatPrice(i.qty * i.price)}</div>
                </div>
            </div>
        `;

        row.querySelector(".minus").onclick = () => {
            i.qty--;
            if (i.qty === 0) cart = cart.filter(x => x.id !== i.id);
            renderCart();
            updateBadge();
        };

        row.querySelector(".plus").onclick = () => {
            i.qty++;
            renderCart();
            updateBadge();
        };

        list.appendChild(row);
    });

    total.textContent = formatPrice(sum);
}

// ================================
//      CHECKOUT (ОФОРМЛЕНИЕ)
// ================================
document.getElementById("checkout-btn").onclick = () => {
    if (cart.length === 0) {
        alert("Корзина пустая");
        return;
    }

    document.getElementById("checkout-products-sum").textContent =
        formatPrice(cart.reduce((s, i) => s + i.qty * i.price, 0));

    recalcDelivery();
    showPage("checkout");
};

// DELIVERY OPTIONS
let deliveryType = "msk"; // default

document.querySelectorAll(".delivery-option").forEach(opt => {
    opt.onclick = () => {
        document
            .querySelectorAll(".delivery-option")
            .forEach(o => o.classList.remove("active"));

        opt.classList.add("active");
        deliveryType = opt.dataset.type;

        recalcDelivery();
    };
});

function recalcDelivery() {
    const deliveryPrices = {
        msk: 1000,
        cdek: 500
    };

    const productsSum =
        cart.reduce((s, i) => s + i.qty * i.price, 0);

    const delivery = deliveryPrices[deliveryType];

    document.getElementById("checkout-delivery-sum").textContent =
        formatPrice(delivery);

    document.getElementById("checkout-total-sum").textContent =
        formatPrice(productsSum + delivery);
}

// ================================
//      SUBMIT ORDER
// ================================
document.getElementById("submit-order").onclick = () => {
    const name = document.getElementById("order-name").value.trim();
    const phone = document.getElementById("order-phone").value.trim();
    const address = document.getElementById("order-address").value.trim();
    const comment = document.getElementById("order-comment").value.trim();

    if (!name || !phone) {
        alert("Введите имя и телефон");
        return;
    }

    const payload = {
        items: cart,
        name,
        phone,
        comment,
        address,
        delivery_type: deliveryType,
        delivery_cost: deliveryType === "msk" ? 1000 : 500,
        total: cart.reduce((s, i) => s + i.qty * i.price, 0)
    };

    if (tg) tg.sendData(JSON.stringify(payload));
    else alert(JSON.stringify(payload, null, 2));

    alert("Заказ отправлен!");
    cart = [];
    updateBadge();
    showPage("new");
};

// ================================
//     NAVIGATION
// ================================
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.onclick = () => showPage(btn.dataset.page);
});

// ================================
//      SUPPORT BUTTON
// ================================
document.getElementById("support-btn").onclick = () => {
    window.location.href = "https://t.me/remontqq";
};

// START
showPage("new");
loadProducts();
updateBadge();
