# Reusable WordPress + Vite theme — DNL Capital project

1. Install a local WordPress site at `http://dnl.local` using OpenServer.
2. Put this folder at `wp-content/themes/dnl-capital` and activate the **Vite WordPress Theme** theme.
3. Set `define('WP_ENVIRONMENT_TYPE', 'local');` in local `wp-config.php`.
4. Run `npm ci` from the theme directory, then `npm run dev`.
5. Only while the dev server is running, set `define('WP_VITE_DEV', true);` in local `wp-config.php` (above the stop editing comment).
6. Open `http://dnl.local` (not localhost:4040) to see PHP templates, with Vite CSS/JS HMR.
7. To test built assets: `npm run build`, then set `WP_VITE_DEV` to false and refresh `dnl.local`.

**Build:** Vite has independent entries `src/js/app.js` and `src/scss/style.scss`. It emits `dist/js/app.min.js` and `dist/css/style.min.css`, with no HTML pages. WordPress renders PHP templates and connects assets through `inc/enqueue.php`. Use `get_template_part()` for PHP components.

**Dev:** Vite is served on port 4040, WordPress through OpenServer at dnl.local. Because they are different origins, verify browser console and HMR connectivity. Set the local domain's HTTP scheme consistently. If you use HTTPS on dnl.local, change Vite to HTTPS/proxy configuration before enabling HMR.

**Image paths:** Use `esc_url(frame_asset('img/name.png'))` in PHP. Local + `WP_VITE_DEV === true` uses the Vite server; all other modes use `dist`. The generated SVG sprite always uses `dist/img/svg/icons.svg`.

**ACF:** create groups via local WP admin. ACF Local JSON automatically uses the `acf-json/` folder in the active theme. Commit the JSON files, not DB data. Production/staging content stays separate.

**Git:** `dist/` and `node_modules/` ignored; `package-lock.json` committed for `npm ci` reproducibility.

**Artifact promotion:** Build once and deploy the same `dist` to staging and production without rebuilding. An undefined `WP_VITE_DEV` means false. `vite preview` serves static assets only; validate the built site through WordPress with `WP_VITE_DEV = false`.

**No CI/CD yet:** staging deploy will be a separate step after the theme front page is migrated and tested.

**Reuse for future projects:** copy the theme scaffold into another project folder, change only its directory/domain and project-specific content. Keep `Theme Name`, `Text Domain`, `WP_VITE_DEV`, and enqueue handles generic. WordPress identifies the installed theme by its directory; when multiple projects are separate WP installations there is no collision.
