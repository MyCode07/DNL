# Staging preview

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
It never creates directories on the VPS. Host verification is mandatory, using
`SSH_KNOWN_HOSTS`; a nonstandard port needs a matching `[host]:port` entry.

The only rsync invocation contains `--dry-run`. There is no live mode, deletion
flag, remote cleanup or production target. SSH/rsync read remote theme data and
metadata only; file transfers and permission/timestamp changes are not applied.
Normal SSH access logging and filesystem access-time updates may still occur.

`--checksum` compares file contents rather than treating rebuilt timestamps as
content changes. It reads files on both machines and costs disk I/O/CPU, but avoids
resending unchanged images and fonts. Rsync's normal delta transfer remains
available for the future real deployment. The itemized output and statistics show
the proposed changes. Without deletion, obsolete remote files remain in place.

Before enabling writes: resolve failing checks, review a successful SSH/dry-run,
confirm staging has `WP_ENVIRONMENT_TYPE=staging` (the theme then always uses
`dist`), and obtain separate approval. A later reviewed change can remove the
hardcoded dry-run flag while retaining path guards and host verification. Do not
rebuild an approved artifact between staging and production; production approval
and immutable artifact promotion are separate future work.
