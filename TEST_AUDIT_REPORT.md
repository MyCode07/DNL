# Аудит тестирования WordPress-темы Frame

Дата: 9 ноября 2026 года. Метод: статический анализ репозитория, без исполнения тестов и сборки.

> Обновление после разрешения на реализацию: выполнены четыре удаления и семь объединений из обсуждённого списка. Очистка `post-title-height` сохранена отдельным тестом, чтобы не усложнять общую lifecycle-фикстуру. Теперь Node-набор содержит 79 кейсов, браузерный — 21; три dev-интеграции не изменены. Таблицы ниже сохраняют исходный снимок аудита (114 кейсов) и рекомендации, а не описывают полностью реализованную оптимизацию. Production-код, зависимости и конфигурация не менялись. Результаты проверок реализации приведены в конце отчёта.

Изменён только этот отчёт. Тесты, production-код, зависимости, конфигурация и окружение не изменялись; серверы не запускались, коммиты не создавались. Исходный Git status был чистым. Все решения ниже — рекомендации для отдельного этапа реализации.

## 1. Текущее состояние

### Инвентаризация и инструменты

Изучены все файлы тестов в build/tests и build/browser, вложенные фикстуры, соответствующие JS/PHP-модули, все build/plugins, скрипты упаковки/деплоя, package.json, конфигурации Vite/Playwright/ESLint, README и workflow staging.

Распределение по фактическим файлам:

| Файл build/tests | Кейсов | Категория |
|---|---:|---|
| cf7-validation.test.js | 1 | PHP-контракт |
| cookies.test.js | 8 | 7 JS + 1 PHP-контракт |
| copy-link.test.js | 3 | JS |
| css-time.test.js | 2 | JS |
| deals-layout.test.js | 4 | JS |
| fonts.test.js | 6 | Production-плагин |
| form-validation.test.js | 12 | JS |
| group-media-queries.test.js | 2 | Production-плагин |
| header.test.js | 6 | JS |
| html-sitemap.test.js | 1 | PHP-контракт |
| load-more-php.test.js | 1 | PHP-контракт |
| load-more.test.js | 6 | JS |
| package-theme.test.js | 4 | Упаковка |
| page-revealed.test.js | 2 | JS |
| page-transition.test.js | 9 | JS + inline bootstrap из PHP |
| plain-phone-inputs.test.js | 2 | JS |
| post-title-height.test.js | 2 | JS |
| runtime.test.js | 10 | JS |
| staging-deploy.test.js | 3 | Деплой |
| static-assets.test.js | 2 | Production-плагин |
| fonts.integration.js | 1 | Vite dev |
| vite-dev.integration.js | 1 | Vite dev + SVG |
| wordpress-reload.integration.js | 1 | Vite dev |
| build/browser/components.spec.js | 25 | Браузерная интеграция |

**Итого: 24 тестовых файла, 114 кейсов: 86 в npm test, 3 в test:dev и 25 в Playwright.** В *.test.js имеется 74 текстовых объявления test(), в integration — 3, в spec — 16; циклы увеличивают их число до указанного итога. Внутренние assert/check и итерации входных значений самостоятельными кейсами не считаются. Результаты исполнения и число фактических skip неизвестны.

В 86 Node-кейсах: **65 JS/runtime, 4 PHP-контракта, 10 тестов production-плагинов, 7 упаковки/деплоя**. Page-transition учитывается как JS/runtime, хотя исполняет извлечённый inline-script PHP-шаблона. Четыре PHP-фикстуры — cf7-validation.php, cookies.php, html-sitemap.php, load-more.php — не отдельные test suites. Дополнительно есть JS-фикстура fonts.js и браузерные page.php/entry.js.

Инструменты:

- Встроенный node:test и node:assert/strict, без Jest, Vitest, jsdom и coverage runner.
- PHP CLI запускается четырьмя Node wrappers. WordPress, CF7 и Yoast подменены локальными функциями и классами. PHPUnit, Composer и отдельной PHP-тестовой конфигурации в теме нет.
- @playwright/test: Chromium, 1 worker, viewport 390×844 по умолчанию, явные изменения ширины внутри кейсов, trace при ошибке, forbidOnly в CI. Нет webServer.
- Playwright создаёт HTML через PHP CLI, бандлит fixture entry через Vite build(write:false), обслуживает маршруты через page.route. Нужен предварительно собранный dist. Большинство кейсов используют исходный initApp в отдельном IIFE; один явно открывает production app.min.js.
- Vite/Sharp/fonteditor-core/PostCSS используются реальными тестами преобразований; файлы создаются во временных каталогах. Даже write:false у Vite не делает тест полностью read-only: fixture и плагины пишут файлы.
- ESLint и Prettier — проверки кода, не функциональные тесты. npm run check включает lint, format:check и npm test, но не PHP lint, браузер и test:dev.
- CI staging.yml запускает npm ci/audit/check/build, Chromium, браузер, dev-интеграции, проверку непустых CSS/JS, php -l по отслеживаемым PHP и упаковку. После staging-передачи выполняет SHA-256 и HTTPS-сверку CSS/JS. Эти шаги не включены в 114 кейсов.

### Что реально проверяется

Есть хорошие отрицательные контракты AJAX, восстановление после ошибки, собственная валидация формы в JS/PHP, cookie defaults и отказ записи, кастомная геометрия deals, асинхронные locks попапов, жизненный цикл и снятие fullscreen overlay. Это сложнее обычного переключения классов и оправдывает часть небольших тестов.

Основные пересечения:

- Девять browser-вариантов menu повторяют keyboard/outside/inert flow; breakpoint-матрицу и полный пользовательский flow можно разделить.
- Browser responsive navigation включает deals, уже проверяемый тремя отдельными сценариями.
- Точные CTA-пороги повторяются в header unit и browser CTA; оставить математику в unit, видимость реального DOM — в общем smoke.
- Два browser popup/menu flow пересекаются; production smoke можно дополнить Tab trap.
- Unit scroll-lock и browser popup не полные дубли: первый проверяет ownership/padding/priority, второй — CSS, события и фокус.
- JS/PHP валидация не взаимозаменяемы: клиентский UX и серверный контроль — разные границы.
- Unit fonts и fonts.integration повторяют содержимое SCSS и конвертацию; dev-интеграции достаточно проверить watcher и доступность готового выхода.

### Существенные пробелы и пределы достоверности

1. **Bootstrap темы и enqueue не исполняются в WordPress.** functions.php подключает обязательные модули; helpers наследует Walker_Nav_Menu; setup регистрирует hooks, а enqueue зависит от окружения и файлов. PHP lint ловит синтаксис, но не отсутствие функций/классов плагинов, ошибки hooks и runtime fatal. Browser page.php не подключает functions.php и сам задаёт frame_asset и HTML head.
2. **Production-пути PHP↔Vite не проверены напрямую.** Vite выдаёт фиксированные dist/css/style.min.css и dist/js/app.min.js; manifest не включён и PHP его не читает. Отсутствие manifest — не дефект. Нет проверки настоящего wp_enqueue_scripts, module tag, filemtime, frame_is_vite_dev, sprite с #fragment и запрета localhost-ресурсов вне local. enqueue молча пропускает отсутствующий файл.
3. **AJAX не доказывает отсутствие дублей записей.** Фиктивный WP_Query всегда выдаёт две условные карточки, а JS считает append без реальных ID. Сохранение paged и последовательность 2→3 проверены, SQL, порядок одинаковых дат, Polylang и фактические HTML-карточки — нет. Комментарий load-more.php fixture «browser checks cover real WordPress» не соответствует browser harness.
4. В load-more JS не заданы отдельные ошибки JSON.parse ответа, неверных типов html/has_more, пустого последнего результата; в PHP — нулевая выборка реальной БД. Общая error-ветка существует, но это не доказательство всех входных границ. JSON.parse(data-load-more) расположен до регистрации cleanup этого компонента: повреждённая конфигурация может прервать initApp. Это риск по чтению кода, не воспроизведённый дефект.
5. **CF7 transport полностью заменён.** Есть успех inline/popup, rejected Promise и wpcf7invalid. Нет маршрутов wpcf7mailfailed/spam/aborted/unaccepted, настоящего SWV, реального reset/statuschanged, позднего результата закрытой/уничтоженной формы и retry внутри исходного popup. В production слушатель читает event.detail.apiResponse без optional chaining у detail: событие без detail — непроверенная граница, не утверждение о поведении настоящего CF7.
6. PHP fixture CF7 не исполняет frame_cf7_checkbox_rules, его fallback и снятие/регистрацию SWV hook: add_action — пустая функция. Не проверяется callback смены получателя. Проверяются кастомные фильтры темы, а не встроенная CF7-валидация.
7. Font tests начинают с синтетического TTF/готового webfont; OTF→TTF с hinting:false отдельно не покрыт. Static assets проверяет PNG→WebP, но не fallback на испорченном изображении и не конфликты одноимённых исходных/генерируемых WebP. Raw-text plugin не имеет отдельного контракта; отдельный suite без реального используемого импорта не нужен.
8. SVG dev-кейс проверяет id и обновление, но не production-use fragment/viewBox end-to-end. Итоговая сборка/упаковка проверяют наличие sprite, не отображение каждой иконки.
9. Browser diagnostics учитывает pageerror, console error/warning и requestfailed; HTTP 404 сам по себе не является requestfailed. Поэтому README обещает более строгую проверку сетевых ресурсов, чем реализовано. Нужен response-status контроль для обязательных same-origin ресурсов, без ложного падения на намеренно ошибочных запросах.
10. Screenshots deals записываются, но не сравниваются с эталоном. Это диагностические артефакты, не visual regression tests. Геометрические assertions полезны, но не подтверждают внешний вид целиком.
11. Mock ssh получает remote-script в stdin, но не исполняет его. Тесты деплоя не подтверждают работу remote realpath/find/permissions, host-key аутентификацию и реальный rsync. Проверка 401 главной в workflow прямо допускает отсутствие проверки приложения; 2xx также не доказывает активацию темы.
12. Нет измерений длительности/флаков/стоимости CI: количественную экономию времени обещать нельзя. Интеграции с polling и browser autoplay потенциально дороги/нестабильны, но фактическая нестабильность не установлена.

## 2. Аудит каждого теста

В таблицах используются короткие идентификаторы по оригинальному имени test(). Каждое объявление рассмотрено; ×N раскрывает все параметры с одинаковым решением. Номера строк не закрепляются, чтобы отчёт оставался читаемым после согласованных правок. Категория «ПЕРЕСМОТРЕТЬ» не потребовалась: рекомендации возможны по коду, а непроверенные runtime-факты явно ограничены выше.

### build/tests/cf7-validation.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| 40-character rule / phone | PHP: ограничения cname/location, преобразование phone, фильтры данных | **ОСТАВИТЬ** | Собственные серверные правила темы; JS не защищает сервер. Фикстура не проверяет настоящий CF7. |

### build/tests/cookies.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| acceptance persists (https:, http:) ×2 | 30 дней, Secure, сохранение, inert баннера | **ОСТАВИТЬ** | Разные протоколы меняют собственные атрибуты cookie. |
| restores and saves both preference states | 0/1, locked поля, синхронизация одинаковых имён | **ОСТАВИТЬ** | Opt-out нельзя потерять или заменить значением по умолчанию. |
| failed writes (throws=false,true) ×2 | Блокировка/исключение storage, откат и retry | **ОСТАВИТЬ** | Не показывать сохранение при фактическом отказе. |
| cached HTML without a saved preference | Восстановление shortcode default | **ОСТАВИТЬ** | Защита от чужого состояния в кешированном HTML. |
| malformed cookie values / cleanup | Повреждённое кодирование и удаление listeners | **ОСТАВИТЬ** | Повреждённая cookie не должна обрушать общий initApp. |
| PHP helpers and shortcode | PHP set/update/delete, defaults, shortcode | **ОСТАВИТЬ** | Серверная ветвь отличается от JS; не является дублем браузера. |

### build/tests/copy-link.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| copy shows success / timer / cleanup | Успех clipboard, таймер, cleanup | **УДАЛИТЬ** | Большая ручная DOM-фикстура ради второстепенного уведомления; достаточно ручного smoke. |
| clipboard failure offers manual copy | Fallback prompt без ложного успеха | **ОСТАВИТЬ** | Отказ разрешения легко пропустить вручную; дешёвый отрицательный сценарий. |
| copy resolving after cleanup | Поздний Promise не показывает уведомление | **УДАЛИТЬ** | При обычной документной навигации небольшой остаточный риск; remount уже проверяется отдельно. |

### build/tests/css-time.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| source and minified CSS durations | 800ms/.8s дают одинаковое время | **ОСТАВИТЬ** | Минификация может изменить единицы CSS; собственный парсер влияет на завершение очереди deals. |
| reduced-motion durations | 0ms/0s | **ОБЪЕДИНИТЬ** | Добавить нулевые значения в таблицу первого кейса; отдельная фикстура не нужна. |

### build/tests/deals-layout.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| visible cards / overflowing active | Сдвиг только при выходе за viewport | **ОСТАВИТЬ** | Собственная геометрия, а не Swiper. |
| returning to an earlier card | Возврат левого края в viewport | **ОСТАВИТЬ** | Отдельная ветвь обратной навигации. |
| any number of cards / no blank space | Clamp у последней карточки и короткого списка | **ОСТАВИТЬ** | Дешёвые проверки границ, ручная матрица менее эффективна. |
| full-width mobile cards | Мобильный шаг с CSS gap | **ОСТАВИТЬ** | Отдельный режим расчёта. |

### build/tests/fonts.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| TTF → WOFF/WOFF2 | Конвертация, SCSS и включение четырёх файлов | **УПРОСТИТЬ** | Сохранить выходы плагина и URL; подробное декодирование glyf проверяет encoder библиотеки и усложняет поддержку. |
| empty WOFF2 encoding | Отказ до перезаписи прежнего файла | **ОСТАВИТЬ** | Собственная защита от публикации повреждённых ассетов; подмена encoder здесь оправдана. |
| ready WOFF/WOFF2 byte-for-byte | Готовые форматы не конвертируются и входят в bundle | **ОСТАВИТЬ** | Свой контракт выбора форматов и публикации. |
| standalone woff / woff2 ×2 | Нет URL отсутствующего формата | **ОСТАВИТЬ** | Два реальных входных формата; низкая цена параметризации. |
| handwritten font declarations | Сохранение ручного SCSS | **ОСТАВИТЬ** | Генератор способен перезаписать пользовательские исходники. |

### build/tests/form-validation.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| field errors use Russian | Язык собственных ошибок | **ОСТАВИТЬ** | Дешёвый контракт локализации. |
| required text | Blank, один символ, Unicode | **ОСТАВИТЬ** | Собственное ограничение темы. |
| optional text | Пусто допустимо, один символ запрещён | **ОСТАВИТЬ** | Отдельная политика необязательных значений. |
| email / native constraints | Собственный regex плюс validity | **ОСТАВИТЬ** | Тестируется решение темы учитывать native validity, а не браузерный алгоритм email. |
| required checkbox groups | Группы в пределах формы | **ОСТАВИТЬ** | Собственная группировка может неверно блокировать заявку. |
| CF7 acceptance optional/inverted | Интерпретация классов acceptance | **ОСТАВИТЬ** | Адаптер темы самостоятельно реализует эти правила; это не тест внутренностей CF7. |
| budget optional/custom | Радио либо произвольный бюджет | **ОСТАВИТЬ** | Нестандартное исключение бизнес-формы. |
| CF7 radio required | Обязательность без aria-required | **ОСТАВИТЬ** | Собственный адаптер темы. |
| service/disabled/honeypot | Исключение служебных полей | **ОСТАВИТЬ** | Иначе скрытое поле способно навсегда отключить submit. |
| cname / location ×2 | Unicode, разрешённые разделители, 40/41 | **ОСТАВИТЬ** | Два именованных поля с кастомными правилами; сохранить оба. |
| telephone optional plus | Формат и registerPhoneValidator | **УПРОСТИТЬ** | Сохранить формат активной plain-phone ветви; регистрацию валидатора неактивного international режима можно убрать после отдельного решения об удалении legacy. |

### build/tests/group-media-queries.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| adjacent identical media merge | Порядок селекторов при merge | **ОСТАВИТЬ** | Собственное преобразование AST, а не тест PostCSS. |
| never move across base rules | Сохранение каскада и breakpoint | **ОСТАВИТЬ** | Регрессия меняет оформление всего сайта; итоговый smoke не ловит все отношения порядка. |

### build/tests/header.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| leading edge: no/down/up/empty/inverse-down/inverse-up ×6 | Направление прокрутки, пиксельные границы, compact, CTA | **УПРОСТИТЬ** | Логика нетривиальна, удалять нельзя. Вынести повторяемую общую CTA/resize матрицу из шести веток; сохранить направления и границы. |

### build/tests/html-sitemap.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| HTML sitemap renders titles / original URLs | Переводы, архивы, группы, escaping, dedupe, cleanup фильтра | **ОСТАВИТЬ** | Кастомная агрегация Yoast; широкие подмены не доказывают совместимость с установленным Yoast. |

### build/tests/load-more-php.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| PHP AJAX query / pagination / signatures | Подписанный query, public posts, язык, страницы, карточки | **ОСТАВИТЬ** | Серверная безопасность и фильтры не дублируются JS. WP_Query фиктивен; реальных ID нет. |

### build/tests/load-more.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| consecutive pages / duplicate clicks / final button | 2→3, один pending fetch, append, has_more=false | **ОСТАВИТЬ** | Компактный основной клиентский контракт. |
| failed loading: offline / HTTP500 / success=false / wrong page ×4 | Без append, та же страница на retry | **ОСТАВИТЬ** | Четыре разных отказа транспорта/контракта, единая фикстура уже разумна. |
| cleanup aborts / late responses | Abort и игнорирование результата после dispose | **ОСТАВИТЬ** | Незавершённый запрос не должен менять уничтоженный компонент. |

### build/tests/package-theme.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| runtime includes / excludes | Allowlist, секреты, untracked, запрет повторного destination | **ОСТАВИТЬ** | Защита состава поставки и локальных данных. |
| outside runner temporary directory | Ограничение output path | **ОСТАВИТЬ** | Защита от записи вне выделенной области. |
| moved inc / nested pages | Перемещение модулей и вложенные шаблоны | **ОБЪЕДИНИТЬ** | Включить эти файлы в основной сценарий состава; отдельный setup Git повторяется. |
| symlinked asset directories | Отказ junction/symlink | **ОСТАВИТЬ** | Иначе в пакет могут попасть внешние файлы. |

### build/tests/page-revealed.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| waits for release / late subscribers | Stateful handoff, ложное раннее событие | **ОСТАВИТЬ** | Защита от зависших/пропущенных entrance-анимаций. |
| removed canvas / aborted consumers | Нет ожидания без bridge, abort | **ОСТАВИТЬ** | Прерывание ожидания важно для cleanup; название removed canvas шире фактических assertions. |

### build/tests/page-transition.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| disabled bootstrap | Модуль выключен без bridge | **ОСТАВИТЬ** | Безопасное отключение необязательной функции. |
| ordinary documents / special links | Фильтр допустимых URL | **ОСТАВИТЬ** | Перехват download/admin/hash/external ломает навигацию. |
| modified / non-primary clicks | Модификаторы, уже обработанные события | **ОСТАВИТЬ** | Сохраняет стандартные способы открытия ссылки. |
| destination covered / fallback | Ранний PHP inline bootstrap и watchdog | **ОСТАВИТЬ** | При отказе bundle страница не должна остаться закрытой canvas. |
| first loads / unavailable storage | Вход без записи storage | **ОБЪЕДИНИТЬ** | Добавить в табличный сценарий bootstrap/fallback. |
| reduced motion / unsupported canvas | Безопасный отказ bootstrap | **ОСТАВИТЬ** | Overlay не должен блокировать контент при недоступном API. |
| opening / closing full coverage | Порядок release и navigation; watchdog/cleanup | **УПРОСТИТЬ** | Проверять observable release/assign; поиск tween через глобальный GSAP timeline привязывает тест к реализации. |
| cached pages reopen | pageshow persisted и handoff | **ОСТАВИТЬ** | Отдельная ветвь возврата из кеша; фиктивное событие не доказывает настоящий bfcache. |
| blocked storage / failing canvas | Native links и release | **ОСТАВИТЬ** | Защита от потери перехода после preventDefault. |

### build/tests/plain-phone-inputs.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| typing and pasted text | Удаление лишних знаков и плюс | **ОСТАВИТЬ** | Собственная очистка введённых данных. |
| listeners / caret / cleanup | Санитизация и позиция курсора | **ОСТАВИТЬ** | Полезная проверка адаптера; capture-порядок на настоящей форме этим EventTarget не доказывается. |

### build/tests/post-title-height.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| slider cleanup / late fonts | Disconnect и поздние callbacks | **ОБЪЕДИНИТЬ** | Перенести проверку observer/late callback в общий lifecycle-сценарий; не терять guard после dispose. |
| grid per-row / breakpoint | 3/2/1 колонки, неполный ряд, reset | **ОСТАВИТЬ** | Кастомный алгоритм выравнивания; браузерная фикстура сетку публикаций не проверяет. |

### build/tests/runtime.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| popup keeps lock until transition finishes | Асинхронное освобождение lock | **ОСТАВИТЬ** | Браузерный reduced-motion smoke не проверяет ожидание перехода. |
| reopening / cancelled close | Новый lock при отмене старого | **ОСТАВИТЬ** | Гонка способна открыть прокрутку под модальным окном. |
| popup cleanup pending locks | Однократное освобождение и отсутствие анимации | **ОСТАВИТЬ** | Отдельные терминальные состояния. |
| disposing in reverse order | Listeners и идемпотентный destroy | **ОСТАВИТЬ** | Общий lifecycle используется всеми компонентами. |
| cleanup failures continue | AggregateError, remaining/late cleanup | **ОСТАВИТЬ** | Одна ошибка не должна оставлять всё приложение работающим. |
| popup over menu lock | Два владельца, padding/important, повторный release | **ОСТАВИТЬ** | Браузер дополнительно проверяет focus/реальную интеграцию, здесь — точный контракт счётчика. |
| compensation recalculated / destroy | Новая ширина при следующем acquire, исходный lock | **ОСТАВИТЬ** | Не тестирует live resize под lock; защищает восстановление исходных стилей. |
| menu CTA viewport policy | Open/closed в разных состояниях | **ОСТАВИТЬ** | Дешёвая таблица собственной политики видимости. |
| header-page CTA | InnerPage в разных комбинациях | **ОБЪЕДИНИТЬ** | Включить матрицу innerPage в предыдущую таблицу. |
| pixel direction / thresholds | Порядок декоративных ячеек | **УДАЛИТЬ** | Не защищает навигацию и снятие overlay; оценку рисунка достаточно делать вручную. |

### build/tests/staging-deploy.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| checksums / target / never deletes | Аргументы rsync, SSH strict, manifest | **ОСТАВИТЬ** | Ограничивает последствия опасного скрипта; подмены SSH/rsync необходимы для изоляции. |
| invalid inputs / SSH failure | Пять отказов до rsync | **ОСТАВИТЬ** | Не запускать передачу с неправильной целью/параметрами. |
| verification failure | Ошибка сверки проваливает deploy | **ОСТАВИТЬ** | Не объявлять непроверенную передачу успешной. Remote shell при этом не выполняется. |

### build/tests/static-assets.test.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| paths / WebP / supplementary files | Реальный Sharp, структура и копирование | **ОСТАВИТЬ** | Свой pipeline и пути; не сравнивать байты lossy-кодека. |
| missing optional / unreadable paths | ENOENT допустим, ENOTDIR фатален | **ОСТАВИТЬ** | Нельзя маскировать ошибку файловой системы как отсутствие необязательных изображений. |

### build/tests/fonts.integration.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| dev serves / updates fonts | Добавление/удаление/изменение и восстановление SCSS | **УПРОСТИТЬ** | Оставить одну проверку watcher→готовый ресурс; конвертация и содержимое уже проверяются без сервера. |

### build/tests/vite-dev.integration.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| HTML-free dev / origins / sprite | CORS и same-origin sprite, обновление/удаление | **УПРОСТИТЬ** | Сохранить интеграцию с WP origins и публикацию до reload; не размножать HTTP-проверки стандартного Vite client. |

### build/tests/wordpress-reload.integration.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| watch theme outside src | Изменения PHP/ACF, новые папки, ignores | **УПРОСТИТЬ** | Сохранить change/add и отрицательные guards; usePolling=false — деталь Vite, задержки 50/400/100ms дают риск нестабильности. |

### build/browser/components.spec.js

| Файл / тест | Что проверяет | Решение | Обоснование |
|---|---|---|---|
| application remount | Observers, corners, locks, remount | **УПРОСТИТЬ** | Оставить очистку собственных ресурсов; не закреплять точный формат clipPath CornerKit. |
| production bundle boots / keyboard | Production JS/CSS, popup inert/focus, Escape | **ОСТАВИТЬ** | Единственный прямой smoke готового app.min.js. |
| gallery autoplay / hover | Swiper delay, running, paused, pagination | **УДАЛИТЬ** | В основном проверяет настройки и штатный autoplay Swiper с реальным ожиданием 3 секунд; ручной проход достаточен. |
| responsive navigation / pagination / tabs | Swiper params и deals навигация | **УПРОСТИТЬ** | Оставить только тему: открытый tab→видимая работоспособная галерея. Deals дублирует три следующих кейса; params библиотеки убрать. |
| desktop deals reserve space | Геометрия, 6 размеров, карточки и nav | **УПРОСТИТЬ** | Оставить отсутствие обрезания и достижимость последней карточки; жёсткие rem-минимумы повторяют дизайн, скриншоты не сравниваются с baseline. |
| desktop deals queued requests | Быстрые клики и финальная карточка | **ОСТАВИТЬ** | Собственная очередь requested/busy; конечный результат важнее деталей GSAP. |
| deals tablet / mobile | Последняя/первая карточка и track на 4 ширинах | **ОБЪЕДИНИТЬ** | Одна responsive-проверка deals вместе с desktop; сохранить mobile/static и tablet/absolute режимы. |
| PHP project descriptions / tabs | Уникальные id, aria-controls, independent state | **ОСТАВИТЬ** | Это кастомная связка PHP/JS и accessibility, а не простой toggle класса. |
| menu widths 390/1100/1280/1281/1439/1440/1441/1600/1780 ×9 | Open/close, inert, focus, Escape/outside | **УПРОСТИТЬ** | Матрица имеет смысл на границах CSS; общий keyboard flow повторить только на mobile/desktop, остальные ширины — компактная проверка breakpoint. |
| header CTA marked blocks | Порог, menu override, возврат | **ОБЪЕДИНИТЬ** | Сохранить пользовательскую видимость CTA в menu/header smoke; точные пороги уже в unit header. |
| marked sections compact header | Compact geometry/label и 1780 | **ОСТАВИТЬ** | Реальный CSS+JS контракт, который unit с подменённой геометрией не доказывает. |
| header compaction interrupted | Промежуточная ширина, прерывание | **УПРОСТИТЬ** | Проверять конечное состояние и доступность меню; бесконечный requestAnimationFrame внутри evaluate и пиксельные промежуточные значения хрупки. |
| popup over menu / focus | Tab trap, Escape, focus, nested lock | **ОБЪЕДИНИТЬ** | Включить Tab trap в production bundle smoke и выполнять этот flow на production entry. Unit lock оставить для гонок. |
| form success popup / inline ×2 | Validation, pending, success focus | **ОСТАВИТЬ** | Два разных пути показа результата; не повторять всю таблицу значений из unit. |
| rejected CF7 submission | Ошибка, диагностика, retry, reset submitting | **ОСТАВИТЬ** | Собственная обработка отклонённого Promise, критична для заявок. |
| server validation errors | invalid, focus, disabled до исправления | **ОСТАВИТЬ** | Собственная синхронизация serverErrors; событие сгенерировано тестом, CF7 не загружен. |

## 3. Что оставить

Сохранять следующие проверки; для помеченных «УПРОСТИТЬ»/«ОБЪЕДИНИТЬ» сохранять риск и наблюдаемое поведение, а не текущую форму теста.

| Набор | От какой ошибки защищает | Почему автоматизация полезнее только ручного прохода |
|---|---|---|
| Load More JS + PHP | Двойной запрос, пропуск страницы после ошибки, потеря фильтра/языка, подмена подписанного query, непубличные записи | Отказы и подписи трудно воспроизводить вручную; быстрые клики и retry требуют повторяемости |
| Form validation, plain-phone, PHP CF7 | Неверная блокировка submit, потеря значений, несогласованные ограничения сервера и клиента | Unicode, 40/41, acceptance и группы дают много дешёвых граничных входов |
| Browser CF7 success ×2, reject/retry, invalid | Потеря заявки, недоступный результат, зависшее submitting | Проверяет взаимодействие собственной формы, popup и фокуса в настоящем DOM |
| Cookies JS/PHP | Потеря opt-out, чужое состояние из кеша, ложное сохранение | Отказ storage и оба сохранённых значения легко пропустить при обычном клике |
| Lifecycle, popup races, scroll-lock | Утечки, premature unlock, падение cleanup блокирует остальные disposers | Отменённые Promise и порядок cleanup надёжнее задавать детерминированно |
| Page transition/revealed, CSS time | Заблокированный canvas, потерянная навигация, неправильные единицы после minify | Отказ bundle/storage/canvas и bfcache-ветки не покрываются одним ручным открытием |
| Deals unit + небольшой browser flow | Недоступная последняя карточка, пустое поле, неверный финал очереди кликов | Чистая математика проверяется быстро; настоящий CSS проверяется отдельно |
| Header unit, compact/menu smoke | Неверная читаемость/CTA на границах и недоступное меню | Много направлений/порогов плюс отдельный CSS-контракт; ручной проход медленнее |
| Project descriptions, grid title rows | Неправильные id/aria/state и группировка неполного ряда | Повторяемые проверки нескольких проектов и breakpoint экономят ручные повторения |
| Clipboard failure | Ложный успех при запрете clipboard | Один отрицательный unit дешевле ручной смены разрешений |
| Fonts, static assets, media grouping | Потерянные URL, перезапись SCSS, нарушение каскада, скрытая ошибка файлов | Проверка выходного контракта воспроизводима и защищает весь сайт |
| Runtime package и deploy guards | Лишние файлы/секреты в пакете, неверная цель, ложный успех передачи | Ручное исполнение отрицательных сценариев опасно; isolated mocks необходимы |
| Sitemap | Потеря переводов/архивов, дубли и неверные заголовки | Детерминированный набор ссылок легче сравнить автоматически; совместимость Yoast подтверждается отдельно |
| Сокращённые dev plugin integration | Изменение PHP/ACF/font/SVG не доходит до WordPress-клиента | Собственные watcher hooks требуют хотя бы одной проверки через настоящий Vite |
| Production browser smoke + PHP lint CI | Ошибка готового entry и синтаксис любого PHP | Должны повторяться для каждой поставки, а не зависеть от памяти разработчика |

## 4. Что удалить или упростить

**Удалить четыре текущих кейса:** два из copy-link (успех/таймер/cleanup и позднее уведомление), декоративный pixel direction из runtime, browser gallery autoplay. Это не основание удалять clipboard fallback, страницу-переход или все маленькие UI-тесты.

**Тривиальная UI-логика:** отдельные тесты простых табов, аккордеонов и обычного «добавился класс popup» здесь не обнаружены. Нельзя выдавать сокращение несуществующих тестов за оптимизацию. Имеющиеся popup-тесты проверяют ownership и гонки, project disclosure — уникальные PHP id и состояние на вкладках, header — направление и соседние пиксельные переходы.

**Сторонние библиотеки:** autoplay delay/running/paused и slidesPerView в browser преимущественно закрепляют конфигурацию Swiper; подробный glyph roundtrip — encoder fonteditor-core; usePolling=false — внутреннюю конфигурацию Vite. Убирать эти детали, сохраняя контракты собственных адаптеров. Полное исключение Swiper из browser не нужно: вкладка с изначально скрытой галереей — риск именно интеграции темы.

**Объединить восемь исходных кейсов** согласно таблицам: zero css-time, moved package, first-load bootstrap, slider title cleanup, innerPage CTA, tablet/mobile deals, browser CTA, browser nested popup. После переноса не потерять уникальные assertions.

**Упростить 25 исходных кейсов:** прежде всего 9 menu-width вариантов, 6 header-direction вариантов, два dev asset теста и reload, remount, browser responsive/desktop geometry/header interruption, fonts conversion, phone legacy branch и GSAP transition. Количество кейсов после такого переписывания зависит от способа параметризации; не следует превращать все проверки в один огромный тест ради счётчика.

Подмены DOM вручную достаточно трудоёмки, но добавление jsdom ради их замены не обосновано. Моки PHP полезны для логики темы; нельзя наращивать их до собственной реализации WordPress. Глобальные подмены Element/window/ResizeObserver/GSAP требуют гарантированного восстановления; текущее использование node:test изолирует файлы, но это не повод включать внутритестовую параллельность без ревизии.

## 5. Минимальная рекомендуемая архитектура

### Инструменты и файлы

Оставить node:test + PHP CLI + существующий Playwright Chromium + текущие ESLint/Prettier. Не добавлять PHPUnit, wp-env, Docker, coverage gate, Vitest, jsdom или visual baseline инфраструктуру только ради этой темы.

Рациональный состав:

- Сохранить load-more.test.js и load-more-php.test.js раздельно по границам клиента/сервера.
- Сохранить form-validation.test.js, plain-phone-inputs.test.js, cf7-validation.test.js и cookies.test.js.
- Сохранить runtime.test.js, header.test.js, page-transition.test.js, page-revealed.test.js, deals-layout.test.js, css-time.test.js, post-title-height.test.js, html-sitemap.test.js; copy-link.test.js сократить до fallback.
- Сохранить fonts.test.js, static-assets.test.js, group-media-queries.test.js, package-theme.test.js и staging-deploy.test.js.
- Сохранить три небольшие *.integration.js как дополнительный набор для изменений build/plugins/Vite, а не превращать их в обязательный локальный запуск при каждом UI-изменении.
- Сохранить components.spec.js с коротким production smoke, формами, project/tab integration и компактными responsive-проверками. Деление этого файла на много spec не обязательно; отделение fixture setup возможно только при реальной пользе.
- Добавить одну лёгкую PHP-контрактную проверку helpers/setup/enqueue, используя тот же PHP CLI и небольшой регистратор hooks, без эмуляции всех плагинов WordPress.
- Добавить один read-only валидатор конечного dist/пакета: обязательные CSS/JS/sprite, локальные URL CSS/import chunks существуют, обязательные шрифты/изображения доступны и в пакет не попали localhost/source URL. Можно расширить существующий packaging stage, не создавать новый runner.

Фиксированные пути без manifest соответствуют текущей архитектуре. Не вводить manifest только для удобства тестов.

### Когда выполнять (рекомендации на будущий разрешённый этап)

| Этап | Минимум |
|---|---|
| Разработка | Релевантный Node/PHP файл; lint/format:check перед завершением изменения. При изменении формы — браузерный form flow, при меню — keyboard flow |
| Перед production build | npm run check и PHP lint runtime-файлов; ошибки не маскировать локальными skip PHP |
| После production build | Валидатор выходных файлов/URL и короткий Playwright production smoke; формы/геометрия по затронутым областям |
| Изменение build/plugins или версии Vite | Полные релевантные plugin-тесты и test:dev только с разрешённым тестовым сервером; CI может выполнять отдельно |
| Перед деплоем | Тот же проверенный runtime-пакет; contract tests упаковки/скрипта; чтение настоящего WordPress с активной темой, WP_VITE_DEV=false |
| После разрешённого деплоя | Текущая SHA/HTTPS-проверка плюс содержательный smoke настоящего сайта; 401 не считать проверкой приложения |

Существующий CI допустимо оставить полным до измерений. Переход к выборочным dev-интеграциям полезен только с корректными path filters (build/plugins, Vite, package/lock), без пропуска обновлений зависимостей.

### Что достаточно проверять вручную

Внешний рисунок анимаций, easing, пиксельный reveal, общее оформление и отступы, hover/autoplay Swiper, копирование при доступном clipboard, social-app deep links, визуальный проход на Safari/iOS и Android. Делать это после затрагивающих UI изменений и перед релизом, а не автоматизировать каждую смену класса.

Настоящий WordPress smoke: главная, статья, архив/страница публикаций, обычная страница, 404, sitemap, RU/EN; без fatal и с настоящими CSS/JS/sprite. Load More: на стабильных данных сравнить ID/URL начальной и двух добавленных страниц, отсутствие пересечений, финал и фильтр/язык. Не обещать отсутствие дублей при изменении набора записей между запросами: нужна отдельно определённая продуктовая политика.

Настоящий CF7/SWV: загрузка формы, обязательные/необязательные поля, бюджет, validation/error UI и статус. Отправку писем выполнять только на согласованной тестовой форме с безопасным получателем; текущий анализ не разрешает отправки. Не добавлять автоматический реальный mail flow к каждому CI.

## 6. Итоговая оптимизация

| Решение по текущим кейсам | Количество |
|---|---:|
| ОСТАВИТЬ | 77 |
| УДАЛИТЬ | 4 |
| ОБЪЕДИНИТЬ | 8 |
| УПРОСТИТЬ | 25 |
| ПЕРЕСМОТРЕТЬ | 0 |
| Всего | 114 |

**77 кейсов рекомендуется сохранить по существу без обязательного переписывания; 33 объединить или упростить, 4 удалить.** Это классификация исходных кейсов, а не обещание будущего числа test(). После одного только удаления останется 110; после объединений/переписывания число будет меньше либо иным из-за параметризации. Точную целевую цифру без согласованной реализации выдавать за измеренную нельзя. Все 24 текущих тестовых файла по-прежнему имеют хотя бы один полезный сценарий; массовое удаление файлов не обосновано.

Необходимые добавления по рискам:

1. Один PHP suite bootstrap-path/setup/enqueue: окружение local/non-local, WP_VITE_DEV true/false, обязательные require paths, production CSS/JS и версии, module tag, sprite fragment, отсутствие обязательного файла с явной диагностикой проверки. Подменённый bootstrap не заменяет настоящий WordPress.
2. Один конечный build/package contract: реальные URL CSS/JS/chunks/sprite и отсутствие ссылок на недоступные файлы; расширить существующий этап проверки артефакта.
3. Расширить существующие CF7/PHP кейсы на budget SWV и callback registration, а browser — на параметризованные mailfailed/spam/aborted/unaccepted и поздний ответ закрытой формы. Не тестировать внутреннюю реализацию CF7.
4. В существующий Load More добавить матрицу malformed JSON/типов и пустого финала; отдельный real-WP smoke закрывает ID-дубли и фильтры.
5. Добавить response-status диагностику обязательных ресурсов в существующий browser harness.

OTF/fallback-image/Yoast negative branches полезны при изменении соответствующих плагинов, но не являются основанием разворачивать тяжёлый новый стек сейчас.

**Зависимости:** отдельной лишней тестовой библиотеки не найдено. node:test встроен; @playwright/test нужен для реального DOM, фокуса и production smoke. PHP fixtures не требуют Composer. Vite/Sharp/PostCSS/fonteditor-core нужны production pipeline, их нельзя удалить из-за сокращения тестов. fast-glob/SVGO также используются SVG-плагином. intl-tel-input — потенциальный кандидат отдельной очистки неактивного phone-inputs.js (это production-зависимость, не экономия тестового стека); сейчас не удалять. Проверка lock-файла не заменяет npm audit; безопасность и совместимость версий в этом аудите исполнением не подтверждались.

Реальное упрощение — сократить повторные flows, детали сторонних API и слишком широкие фикстуры, добавить два небольших контракта вместо нового фреймворка. Экономия минут, процентов и объёма зависимостей не измерялась и не заявляется.

## 7. План изменений

### 1. Критически важные

1. После отдельного разрешения запустить существующие check/build/browser/dev/PHP lint в согласованном окружении; зафиксировать pass/fail/skip и длительности. Dev-интеграции запускают временные серверы, обычный build меняет dist и может генерировать fonts/SCSS — это требует разрешения в рамках текущих ограничений.
2. Закрыть bootstrap/enqueue и конечные пути поставки лёгкими контрактами; провести smoke настоящего WordPress без изменения его конфигурации, если production-режим уже настроен.
3. Закрыть CF7 event/error/SWV gaps и реальные ID Load More; сохранить клиентский и серверный контракты.
4. Исправить browser диагностику HTTP failures; уточнить README и ложный комментарий fixture о настоящем WordPress. Не считать 401/наличие CSS подтверждением активации темы.

### 2. Полезные, но необязательные

1. Удалить четыре низкоценностных кейса, объединить восемь по таблицам, перенести уникальные assertions.
2. Упростить menu matrix, header общие ветви и deals responsive flows; перенести полноценный popup keyboard flow на production entry.
3. Уменьшить зависимость transition tests от глобального GSAP timeline, dev tests — от фиксированных задержек, font tests — от деталей encoder.
4. При затрагивающих изменениях добавить OTF, damaged-image fallback и отрицательный sitemap-контракт. Проверить remote guards в изолированной shell-фикстуре только если это можно сделать без настоящего SSH/deploy.
5. После измерений решить, нужны ли dev-интеграции на каждом push или только при изменении сборки.

### 3. Косметические и низкоприоритетные

1. Дать разным параметрам failure/throws уникальные имена в TAP, чтобы различать причины падения.
2. Уточнить названия removed canvas и resize compensation: нынешние assertions проверяют отсутствие bridge и новый acquire, а не удаление canvas/live resize.
3. Удалить неиспользуемые вычисления geometry.transform, упорядочить небольшие fixtures; не добавлять общий DOM framework ради косметики.
4. Отдельно решить судьбу неактивного international-phone кода и зависимости; это выходит за сокращение тестов.

## Ограничения проверки

В ходе аудита не запускались npm scripts, node --test, Playwright, PHP fixtures/lint, build, npm audit, серверы или CI. Выводы о наличии проверок и пробелах основаны на чтении assertions, fixtures, конфигурации и production-кода. Нет утверждения, что текущие тесты проходят, что браузерные ожидания устойчивы или что сайт исправен в runtime. Для этих выводов требуется отдельный согласованный запуск.

Реализация рекомендаций не начата. Единственный результат текущего этапа — TEST_AUDIT_REPORT.md.

## Выполненный этап после согласования

Выполнены перечисленные в обсуждении четыре удаления и семь объединений; остальные рекомендации аудита пока не реализовывались. `post-title-height` оставлен отдельным: перенос увеличивал бы связанность общей фикстуры. В объединённом browser header-кейсе между фазами выполняется новое открытие фикстуры, чтобы искусственный compact-маркер и фокус предыдущей фазы не влияли на CTA. Assertions видимости не ослаблены.

Проверки реализации:

- `npm run check`: ESLint и Prettier прошли, 79 Node/PHP-кейсов прошли, пропусков нет.
- `npm run test:browser`: после исправления изоляции header-фикстуры полный повторный прогон — 21 passed (41,2 с).
- Финальные ESLint/Prettier для изменённого browser-файла и `git diff --check` прошли.
- Сборка и dev-интеграции не запускались. Browser использовал существующие `dist` CSS/JS и обычную сборку fixture entry в памяти; свежесть production-сборки этим этапом не подтверждается.
- Пользовательские изменения SCSS не затронуты; production-код, package/lock и конфигурация не менялись. Коммиты не создавались.

Итоговый зарегистрированный набор: 79 Node/PHP + 21 browser + 3 неизменённых dev integration = 103 кейса вместо 114. Из них на этом этапе выполнены 100; dev integration не выполнялись.

