# Учебный пример: загрузка карточек из HTML следующей страницы

Этот файл не подключён к сайту. На сайте используется второй вариант:
`src/js/features/load-more-posts.js` → `admin-ajax.php` → `inc/ajax/load-more.php`.

Ниже — вся основная логика первого варианта. Браузер асинхронно получает
полную страницу, разбирает её как документ и переносит только карточки.
Пользователь остаётся на текущей странице. Скрипты полученного документа
не исполняются.

## PHP: разметка архива

После цикла WordPress выводим контейнер и ссылку на следующую страницу.
Этот пример заменяет текущую кнопку, а не добавляется рядом с ней.

```php
<?php global $wp_query; ?>
<div data-posts-container>
    <?php while (have_posts()) : the_post(); ?>
        <?php get_template_part('template-parts/post-cards/post'); ?>
    <?php endwhile; ?>
</div>

<?php if (max(1, (int) get_query_var('paged')) < $wp_query->max_num_pages) : ?>
    <a class="load-more" href="<?php echo esc_url(get_next_posts_page_link()); ?>"
       data-text-loading="Загрузка…">
        Загрузить ещё
    </a>
<?php endif; ?>
<p data-load-more-status role="status" hidden></p>
```

Это ссылка: если JS не загрузился, она просто откроет следующую страницу.
WordPress сам формирует адрес с учётом текущего архива. На последней странице
ссылки нет — по этому признаку JS понимает, что загрузка закончилась.

## JavaScript: запрос, извлечение, добавление

```js
// Инициализировать один раз после готовности DOM.
const link = document.querySelector('.load-more');
const container = document.querySelector('[data-posts-container]');
const status = document.querySelector('[data-load-more-status]');
let loading = false;

link?.addEventListener('click', async (event) => {
    // Ctrl/Cmd + click по-прежнему открывает ссылку в новой вкладке.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (loading || !container) return;

    loading = true;
    const originalText = link.textContent;
    link.textContent = link.dataset.textLoading;
    link.setAttribute('aria-disabled', 'true');
    container.setAttribute('aria-busy', 'true');
    status.hidden = true;

    try {
        const url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin) throw new Error('Unexpected origin');
        const response = await fetch(url, { credentials: 'same-origin' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();
        const nextDocument = new DOMParser().parseFromString(html, 'text/html');
        const nextContainer = nextDocument.querySelector('[data-posts-container]');
        if (!nextContainer) throw new Error('Posts container is missing');

        // Сначала проверяем и готовим следующую ссылку, затем меняем текущую страницу.
        const nextLink = nextDocument.querySelector('.load-more');
        const nextUrl = nextLink
            ? new URL(nextLink.getAttribute('href'), response.url)
            : null;
        if (nextUrl && nextUrl.origin !== window.location.origin) {
            throw new Error('Unexpected next page origin');
        }

        const cards = [...nextContainer.children];
        if (!cards.length && nextLink) throw new Error('Empty page with more posts');
        cards.forEach((card) => {
            // В этой теме новые карточки иначе скрываются стартовыми стилями анимации.
            card.classList.add('is-revealed');
            container.append(document.importNode(card, true));
        });

        if (nextUrl) link.href = nextUrl.href;
        else link.remove();

        // Здесь обновляются зависимые расчёты интерфейса, например ScrollTrigger.refresh().
        // В текущей теме высоты заголовков пересчитывает ResizeObserver контейнера.
    } catch (error) {
        status.textContent = 'Не удалось загрузить записи. Попробуйте ещё раз.';
        status.hidden = false;
        // Адрес не изменился: повторный клик загрузит ту же порцию.
    } finally {
        loading = false;
        link.textContent = originalText;
        link.removeAttribute('aria-disabled');
        container.removeAttribute('aria-busy');
    }
});
```

## Что важно понимать

- В ответе приходят также header, footer и прочая разметка. Мы используем только
  содержимое `[data-posts-container]` и следующую ссылку `.load-more`.
- Рубрика, тег, язык и номер страницы сохраняются благодаря адресу следующей
  страницы. Не нужно повторно собирать `WP_Query` в AJAX-обработчике.
- URL в адресной строке не меняется. После перезагрузки снова будет исходная страница.
- Подход возможен и на обычной странице с собственным запросом, если у неё
  реализованы адреса пагинации, обработка номера страницы и следующие ссылки.
  Он не ограничен файлом `archive.php`, но сам по себе пагинацию не создаёт.
- Для нескольких независимых списков нужны отдельные контейнеры и ссылки
  внутри каждого списка. В примере ради понятности показан один список.

## Как расширять используемый на сайте AJAX-вариант

На переводимой странице создайте обычный `WP_Query` с `post_type`,
`posts_per_page`, `paged` и нужными фильтрами. Выведите карточки в
`[data-posts-container]`, а кнопку рядом с ним, внутри того же родителя:

```php
get_template_part('template-parts/load-more-btn', null, [
    'query' => $posts, // Тот же WP_Query, которым выведена первая порция.
    'template' => 'post', // template-parts/post-cards/post.php; свой шаблон — по необходимости.
]);
```

Кнопка передаст подписанные сервером настройки этого запроса. В архиве и
`index.php` запрос передавать не нужно: используется глобальный `$wp_query`.
Для нового типа записи нужна его публичная регистрация и, при переводе,
включение типа в Polylang. Нельзя использовать `offset` вместо `paged`:
этот загрузчик использует постраничную выборку.

Официальные справочники:
[WordPress AJAX](https://developer.wordpress.org/plugins/javascript/ajax/),
[WP_Query](https://developer.wordpress.org/reference/classes/wp_query/),
[Polylang: язык запросов и AJAX](https://polylang.pro/documentation/support/developers/developpers-how-to/).
