// Поддержка Telegram WebApp (на будущее)
let tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
    tg.expand(); // разворачиваем мини-приложение на весь экран
}

// Функция показа нужной страницы
function showPage(pageName) {
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
    });

    // Показываем выбранную страницу
    const page = document.getElementById('page-' + pageName);
    if (page) {
        page.style.display = 'block';
    }

    // Обновляем активную кнопку внизу
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === pageName) {
            btn.classList.add('active');
        }
    });
}

// Вешаем обработчики на кнопки нижнего меню
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        showPage(page);
    });
});

// При первом открытии показываем вкладку "Б/У"
showPage('used');
