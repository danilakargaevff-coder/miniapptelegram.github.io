// ========================
//   Telegram Web App Init
// ========================

let tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

if (tg) {
    tg.ready();
    tg.expand();
    console.log("Telegram WebApp detected ✔");
} else {
    console.log("Telegram WebApp NOT detected ❌");
}

// ========================
//       CART + PRODUCTS
// ========================

let productsNew = [];
let productsUsed = [];
let cart = [];

function formatPrice(num) {
    return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
}

function getCartTotal() {
    return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function getCartCount() {
    return cart.reduce((s, i) => s + i.qty, 0);
}

function updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge) return;

    const c = getCartCount();
    if (c > 0) {
        badge.style.display = "inline-flex";
        badge.textContent = c;
    } else {
        badge.style.display = "none";
    }
}

// ========================
//         CATALOG
// ========================

async function loadProducts() {
    try {
        const [newRes, usedRes] = await Promise.all([
            fetch("products_new.json"),
            fetch("products_used.json")
        ]);

        productsNew = await newRes.json();
        productsUsed = await usedRes.json();
    } catch (err) {
        console.error("Ошибка загрузки товаров", err);
    }
}

// ========================
//        CART LOGIC
// ========================

function addToCart(p, isUsed) {
    let ex = cart.find(i => i.id === p.id);
    if (ex) ex.qty++;
    else cart.push({ ...p, isUsed, qty: 1 });

    updateCartBadge();
}

function renderCart() {
    const list = document.getElementById("cart-list");
    const total = document.getElementById("cart-total");
    list.innerHTML = "";

    if (cart.length === 0) {
        list.innerHTML = "<p style='color:#888'>Корзина пуста</p>";
        total.textContent = "0 ₽";
        updateCartBadge();
        return;
    }

    cart.forEach(i => {
        const row = document.createElement("div");
        row.className = "cart-item";

        row.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${i.name}</div>
                <div class="cart-item-meta">${i.isUsed ? "Б/У" : "Новый"}</div>
                <div class="cart-item-bottom">
                    <div class="cart-qty">
                        <button class="minus">−</button>
                        <span>${i.qty}</span>
                        <button class="plus">+</button>
                    </div>
                    <div class="product-price">${formatPrice(i.price * i.qty)}</div>
                </div>
            </div>
        `;

    });

    total.textContent = formatPrice(getCartTotal());
    updateCartBadge();
}

// ========================
//       ORDER SEND
// ========================

document.getElementById("submit-order-btn").addEventListener("click", () => {

    if (!tg) {
        alert("tg WebApp не найден — Mini-App открыт не в Telegram");
        return;
    }

    const name = document.getElementById("order-name").value.trim();
    const phone = document.getElementById("order-phone").value.trim();
    const contact = document.getElementById("order-contact-method").value;
    const delivery = document.getElementById("order-delivery-type").value;
    const deliveryCost = parseInt(document.getElementById("order-delivery-cost").value.replace(/\s/g,'')) || 0;
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
        contact_method: contact,
        delivery_type: delivery,
        delivery_cost: deliveryCost,
        address,
        comment
    };

    console.log("📤 ОТПРАВКА tg.sendData():", payload);
    tg.sendData(JSON.stringify(payload));

    tg.close();
});
 
// ========================
//          INIT
// ========================

loadProducts();
updateCartBadge();
