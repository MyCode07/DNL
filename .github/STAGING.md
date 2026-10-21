# Staging deployment

`staging.yml` runs on pushes to `main` and manual dispatches of `main`. It uses the
`staging` Environment and only its five SSH secrets. Actions are pinned to commit
SHAs; the workflow token has only `contents: read`. Concurrency prevents overlapping
staging runs. Node.js 24 and PHP 8.3 match the project's requirements.

All checks are blocking: `npm ci`, `npm run check`, the existing Vite build,
required CSS/JS checks, PHP lint, and runtime packaging precede SSH. Any failing
check prevents SSH and rsync from executing; there is no bypass or
`continue-on-error`.

The temporary package includes tracked root PHP files, PHP under `inc/` and
`template-parts/`, `style.css`, ACF JSON, and the build's runtime asset directories.
It excludes development sources, dependencies, build tools, tests and local
settings. Source and package symlinks are rejected. No release system, backups,
production workflow or artifact promotion is configured in this initial phase.

The SSH script requires user `chipsa` and exactly
`/var/www/chipsa/data/www/dnl.chipsa.ru/wp-content/themes/frame/`. The directory
must already exist, resolve to the same canonical path, and contain no symlinks.
The root directory must be created manually; rsync creates its contents only
after verifying the SSH user and directory permissions. Host verification uses
`SSH_KNOWN_HOSTS`; a nonstandard port needs a matching `[host]:port` entry.

The rsync invocation writes only to the fixed staging theme path. There is no
deletion flag, remote cleanup or production target. The theme is not activated;
no WP-CLI commands run. Existing remote files absent from the package are retained.

`--checksum` compares file contents rather than treating rebuilt timestamps as
content changes. It reads files on both machines and costs disk I/O/CPU, but avoids
resending unchanged images and fonts. Rsync's normal delta transfer is retained.
The itemized output and statistics show actual transfers. A repeat workflow run
of the same commit should report zero regular-file transfers for identical build
outputs; timestamps and directory metadata can still be updated.

After transfer, SSH verifies required theme entry files and every packaged file
against a SHA-256 manifest streamed over stdin; the manifest is not stored on the
VPS. HTTPS checks test homepage availability and compare served CSS/JS bytes with
the package. HTTP 200 alone does not prove theme activation or correct rendering.
Activate Frame manually in WordPress and visually validate the site separately.

Staging must have `WP_ENVIRONMENT_TYPE=staging` (the theme then always uses `dist`).
Server configuration and other WordPress directories are not changed. Production
approval and immutable artifact promotion remain separate future work; do not
rebuild an approved artifact between staging and production.
