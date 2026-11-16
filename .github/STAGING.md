# Staging deployment

`staging.yml` checks pushes to every branch, pull requests to `main`, and manual
dispatches. Only `main` pushes/manual dispatches deploy. It uses the
`staging` Environment and only its five SSH secrets. Actions are pinned to commit
SHAs; the workflow token has only `contents: read`. Concurrency prevents overlapping
staging runs. New pushes cancel older checks for the same ref, but never cancel an
active deployment. Node.js 24 and PHP 8.3 match the project's requirements.
The runner explicitly updates PHP and requires at least upstream PHP 8.3.36.
This checks the CI interpreter only; it does not update or certify the VPS's
web PHP runtime. Vendor-backported server packages must be assessed separately.

All checks are blocking: `npm ci`, `npm run check`, the existing Vite build,
required CSS/JS checks, PHP lint, and runtime packaging precede SSH. Any failing
check prevents SSH and rsync from executing; there is no bypass or
`continue-on-error`.

The temporary package includes tracked root PHP files, PHP under `inc/`,
`template-parts/` and `pages/`, `style.css`, ACF JSON, and the build's runtime asset
directories. The packager supports nested PHP modules without fixing their names
to a legacy `inc/` layout. New runtime files must be committed to be packaged.
It excludes development sources, dependencies, build tools, tests and local
settings. Source and package symlinks are rejected. No release system, backups,
production workflow or artifact promotion is configured in this initial phase.

The SSH script requires user `chipsa` and the destination configured in
the `STAGING_THEME_PATH` Environment variable. The destination must match
`/var/www/chipsa/data/www/<hostname>/wp-content/themes/frame/` exactly, including
the trailing slash; traversal and shell metacharacters are rejected. The directory
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
the package. The homepage intentionally requires authentication: HTTP 401 is
reported as reachable but protected, without attempting to bypass authentication.
Other unexpected HTTP errors fail the check. Asset responses must be successful
and match package bytes. HTTP 200 alone does not prove theme activation or correct rendering.
Activate Frame manually in WordPress and visually validate the site separately.

Configure these non-secret variables in Settings → Environments → staging →
Environment variables before running the workflow:

| Variable | Purpose |
| --- | --- |
| `STAGING_URL` | HTTPS origin of the WordPress site, with an optional trailing slash; no credentials, path, query or fragment. Used for the environment link and HTTPS checks. |
| `STAGING_THEME_PATH` | Absolute existing server directory of the Frame theme, in the guarded format above. |

There are no fallback domains or deployment directories in the workflow/scripts.
An invalid or missing URL fails before SSH/rsync. SSH credentials and host keys
remain in Environment secrets. `STAGING_URL` assumes WordPress is installed at
the domain root; the public theme assets remain under `/wp-content/themes/frame/`.

Dependency installation skips npm's automatic audit because the next step runs a
blocking `npm audit --audit-level=high`. CI installs only Chromium's headless
shell, matching Playwright's default headless mode without a browser channel.
SSH keepalives and an rsync I/O timeout stop stalled connections without waiting
for the full job timeout. Checksums and full remote/HTTPS verification remain
mandatory.

Staging must have `WP_ENVIRONMENT_TYPE=staging` (the theme then always uses `dist`).
Server configuration and other WordPress directories are not changed. Production
approval and immutable artifact promotion remain separate future work; do not
rebuild an approved artifact between staging and production.
