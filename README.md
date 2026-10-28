# Frame — WordPress + Vite

WordPress формирует страницы из PHP-шаблонов. Vite собирает отдельные JS- и SCSS-входы без HTML.

## Требования

- Node.js 24+
- npm

## Запуск

```bash
npm install
npm start
```

Сервер ассетов: `http://localhost:4040` (фиксированный порт). Страницы открывайте через WordPress: `http://dnl.local` или `https://dnl.local`; оба origin разрешены в CORS.

В локальном `wp-config.php` задайте `WP_ENVIRONMENT_TYPE` как `local` и `WP_VITE_DEV` как `true`. Для проверки production-сборки переключите `WP_VITE_DEV` в `false`.

В dev HTML не нужен: JS и SCSS обрабатываются Vite по запросу с горячим обновлением, а не записываются в `dist`. При запуске автоматически создаётся `dist/img/svg/icons.svg`: WordPress должен отдавать внешний SVG-спрайт со своего origin. При добавлении, изменении или удалении иконок спрайт обновляется, а страница перезагружается. Полную папку `dist` с JS, CSS и остальными ресурсами создаёт `npm run build`.

`npm run dev` — эквивалентная команда запуска. Все команды выполняются из корня проекта.

| Команда | Назначение |
| --- | --- |
| `npm start` / `npm run dev` | Запуск сервера разработки |
| `npm run build` | Сборка в `dist/` |
| `npm run preview` | Статическая раздача ассетов без выполнения PHP |
| `npm test` | Тесты runtime, стилей и плагинов |
| `npm run sprite` | Старая команда генерации спрайта в `src`; WordPress использует спрайт из `dist` |

Production build:

```bash
npm run build
```

Готовые ассеты появятся в `dist/`, включая `js/app.min.js` и `css/style.min.css`. HTML не генерируется. Перед сборкой Vite очищает эту папку.

Для локальной проверки production-сборки:

Выполните `npm run build`, установите `WP_VITE_DEV` в `false` и откройте сайт через WordPress. `vite preview` раздаёт только ассеты и не исполняет PHP.

## Структура

- `src/scss/style.scss` — главный SCSS entry.
- `src/js/app.js` — главный JS entry.
- `src/img/` — изображения.
- `src/files/` — любые файлы, которые нужно скопировать в `dist/files/` без изменений.
- `src/fonts/` — `.otf` / `.ttf` шрифты.
- `src/svg/` — SVG-иконки для sprite.
- `build/plugins/` — плагины обработки шаблонов, шрифтов, изображений и других ресурсов.
- `build/tests/` — тесты на встроенном тестовом раннере Node.js.
- `vite.config.js` — конфигурация Vite и Rolldown.

## WordPress templates

Pages are rendered by PHP. Use `get_template_part()` for reusable components. Vite has no HTML entries or `@@include` processing.

## SCSS / CSS

В dev Vite компилирует SCSS на лету.
Стили подключаются через `@use`. Переменные и миксины нужно явно подключать в каждом SCSS-файле, который их использует. Например, в `src/scss/parts/hero.scss`:

```scss
@use "../common/variables" as *;
@use "../mixins" as *;

.hero {
    color: $black;
    @include adaptive-value("padding-bottom", 100, 30, 1);
}
```

Правила `@use` размещаются до CSS-правил. Для Swiper подключаются готовые CSS-файлы, чтобы не использовать его устаревшие Sass-импорты.

В production CSS автоматически минифицируется и сохраняется как:

`dist/css/style.min.css`

Autoprefixer настроен на `last 3 versions`. В production одинаковые media queries группируются.

# SCSS structure

`style.scss` is an independent Vite entry, enqueued by WordPress separately from JavaScript. Its explicit import order preserves the existing CSS cascade. Vendor CSS, including Lenis and Swiper A11y, is collected in `vendors/_index.scss`.

- `abstracts/` — variables and mixins. `_index.scss` exposes them with `@forward`; these modules emit no CSS.
- `base/` — reset, fonts, global styles and shared animation rules.
- `vendors/` — third-party styles, collected in one entry point.
- `layout/` — header, footer and grid.
- `components/` — menu, popup, form, cards, ticker and accordion.
- `sections/` — hero and the existing shared section stylesheet.
- `overrides/` — existing large-screen overrides.
- `dev/` — existing development page switcher styles.

Files prefixed with `_` are Sass partials, loaded through `@use`. Component and section files import variables explicitly from `../abstracts/variables`. Keep new imports in the appropriate position in `style.scss`; do not reorder existing imports without checking the cascade.

This change only reorganizes files and their imports. Existing selectors, declarations, media queries, mixins and comments are preserved. The section stylesheet remains intact. The accordion remains available but is not loaded by default, matching its previous behavior.

Font generation in `build/plugins/fonts.js` targets `base/_fonts.scss`. Relative font URLs account for the deeper directory. Image aliases (`@img`) remain unchanged.

Run `npm run build` to verify the stylesheet and asset paths. The restructuring was verified against the original Sass output and production CSS; the production CSS is byte-for-byte identical.


`@img/...` можно продолжать использовать в SCSS: алиас указывает на `src/img`.

## JavaScript

Главный JS entry: `src/js/app.js`. WordPress подключает модуль через `wp_enqueue_script()`. Vite/Rolldown собирает JS независимо от SCSS; HTML не генерируется.

Для входных JS-файлов настроен шаблон `js/[name].min.js`, для общих чанков — `js/chunks/[name]-[hash].js`. Отдельный `dist/js/app.min.js` не гарантируется: имена и состав файлов зависят от графа импортов.

Сейчас весь код `app.js` закомментирован, а страницы содержат минимальную разметку. Меню, слайдеры, анимации и другие модули нужно подключать по мере добавления соответствующей разметки. Успешная сборка не означает, что эти функции уже включены.

Импорты `.svg`, `.glsl`, `.vs`, `.fs`, `.vert`, `.frag` без query продолжают импортироваться как raw text — это заменяет старый `raw-loader`.
# JavaScript architecture

The site uses browser ES modules, Vite, GSAP/ScrollTrigger, Lenis and Swiper. No framework or transpilation layer is required.

- `app.js` is the only browser entry point. It initializes components after the DOM is ready, disposes the previous app before reinitialization and cleans up on Vite hot reload.
- `features/` owns interaction and state: menu, header, dialogs, tabs, sliders, smooth scrolling and the development page switcher.
- `animations/` owns visual transitions. `index.js` initializes section scroll animations; menu and CTA controllers are created by the menu feature.
- `core/` contains shared lifecycle, media queries, GSAP registration and overlay scroll locking.
- `utils/` contains small focus and calculation helpers. Utilities do not initialize components.

## Component conventions

Export an explicit initializer that accepts the document or component element. Read the DOM during initialization, not at module import. Return a cleanup function (or a controller with `destroy`). Register events with `createScope`, and register observers, library instances and animation contexts as disposers. Cleanup is idempotent and runs in reverse order.

Keep existing HTML classes and data attributes as the component contracts. Do not add placeholder API endpoints, fake form submissions or business behavior. Initialize optional components only when their markup exists.

The menu and header share a single CTA animation controller. An open menu shows the CTA regardless of scroll position. Closing it restores breakpoint/scroll visibility. Compact desktop body height is measured at the expanded width to avoid a jump when text stops wrapping.

Dialogs and the mobile menu acquire independent scroll-lock handles. Releasing one overlay does not unlock the page while another is open. Dialogs trap focus, close with Escape and restore focus to their trigger. Reduced-motion preference disables smooth scrolling, section parallax and decorative pixel transitions; menu and dialog transitions become immediate.

## Checks

```sh
npm run check
npm run build
```

`npm run format` formats the frontend JavaScript and its lint/test configuration. Unit tests cover disposal, nested scroll locks, CTA visibility and pixel direction. Browser verification should cover all pages, menu edges and rapid clicks, desktop CTA scroll visibility, fullscreen mobile layout, dialog keyboard focus, project tabs and all sliders. Import `initApp` from the entry point to verify repeated mounting without duplicated listeners or canvases.

Unused template utilities were removed from the runtime folder. The user-created `src/js copy` backup is outside this architecture and is not modified or included in checks.

## Dependency audit

Runtime library versions are preserved in this refactor. `npm audit` still reports existing advisories for Swiper 10 and the asset-build dependencies (`sharp`, `fast-glob` and `source-map-js`). This work is not a full dependency-security upgrade. Swiper options in this site are static; the library requires a separately tested version upgrade before accepting untrusted configuration.

API references: [Lenis integration and cleanup](https://github.com/darkroomengineering/lenis), [Swiper API](https://swiperjs.com/swiper-api), [ESLint flat configuration](https://eslint.org/docs/latest/use/configure/configuration-files), [Prettier installation](https://prettier.io/docs/install).

## Images

В dev изображения отдаются прямо из `src/img/`.

В production:

- JPG/JPEG оптимизируются;
- PNG оптимизируются;
- GIF сохраняется/пережимается, если Sharp поддерживает конкретный файл;
- исходный WebP оптимизируется;
- для JPG/JPEG/PNG/GIF дополнительно создается `.webp`;
- SVG/ICO/AVIF копируются без разрушительной обработки;
- структура подпапок сохраняется.

Все изображения попадают в `dist/img/`.

## Fonts

При запуске `start`, `dev` и `build`:

1. `.otf` конвертируется в `.ttf` в `src/fonts/`;
2. `.ttf` конвертируется в `.woff` и `.woff2`;
3. при наличии `.ttf` файл `src/scss/fonts.scss` создается с `@font-face`, если он отсутствует или содержит маркер-заглушку `Auto-generated after fonts are added`.

Пользовательский `fonts.scss` без этого маркера не перезаписывается. Чтобы пересоздать его после добавления шрифтов, сохраните нужные ручные правки, удалите `src/scss/fonts.scss` и перезапустите команду.

## SVG sprite

Положите SVG-файлы в `src/svg/`.
При `npm run build` спрайт создаётся в:

`dist/img/svg/icons.svg`

Использование:

```html
<svg aria-hidden="true">
  <use href="<?php echo esc_url(frame_asset('img/svg/icons.svg#icon-name')); ?>"></use>
</svg>
```

ID равен имени исходного SVG-файла без `.svg`.

PHP всегда использует спрайт из `dist`. В dev он создаётся и обновляется автоматически. Для production выполните:

```bash
npm run build
```

## files

Всё содержимое `src/files/` при production build копируется без изменений в:

`dist/files/`

## Cache busting

WordPress versions CSS and JS via `filemtime()` in `inc/wp/enqueue.php`. HTML version injection and `build/version.json` have been removed.

## Проверки

```bash
npm ci
npm run check
npm run build
npx playwright install chromium
npm run test:browser
```

`npm run check` проверяет JS, сборочные скрипты, тесты и форматирование workflow, затем запускает unit-тесты и PHP-контракты. PHP CLI обязателен в CI; локально PHP-тесты пропускаются только при его отсутствии. Эти команды не запускают dev-сервер.

Браузерные проверки в `build/browser` используют настоящее PHP-меню и карточки проектов, GSAP и CSS из production-сборки. Они проверяют вкладки, клавиатуру, блокировку прокрутки, отправку форм и восстановление после ошибок. WordPress/ACF-данные фиксированы; транспорт CF7 подменён, письма не отправляются. HTTP-запросы обслуживает Playwright без отдельного сервера и базы. Это проверки компонентов, а не полного WordPress-сайта.

Для уже установленного Edge можно задать `PLAYWRIGHT_CHANNEL=msedge` вместо установки Chromium.

`npm run test:dev` отдельно запускает три интеграционных теста Vite во временных каталогах на случайных портах. Запускайте их локально только когда разрешён запуск тестовых серверов; CI выполняет их автоматически.

Workflow проверяет ветки и pull request. Деплой доступен только из `main` после всех проверок и использует сохранённый пакет без повторной сборки. При ошибках браузерных тестов сохраняются trace-артефакты.

Полный сайт проверяйте через WordPress с `WP_VITE_DEV = false`: главную, статью, архив, обычную страницу, 404 и языковые версии. Компонентные тесты не заменяют проверку настроек и совместимости установленных плагинов.
