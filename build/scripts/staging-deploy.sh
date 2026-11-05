#!/usr/bin/env bash
set -euo pipefail

# Live staging deployment. Production and deletion are deliberately unsupported.
target='/var/www/chipsa/data/www/dnl.chipsa.ru/wp-content/themes/frame/'
expected='/var/www/chipsa/data/www/dnl.chipsa.ru/wp-content/themes/frame/'
[[ "$target" == "$expected" ]] || { echo 'Unexpected staging target' >&2; exit 1; }
: "${RUNNER_TEMP:?Missing runner temporary directory}"
: "${FRAME_PACKAGE_DIR:?Missing theme package}"
: "${SSH_HOST:?Missing SSH_HOST}"
: "${SSH_PORT:?Missing SSH_PORT}"
: "${SSH_USER:?Missing SSH_USER}"
: "${SSH_PRIVATE_KEY:?Missing SSH_PRIVATE_KEY}"
: "${SSH_KNOWN_HOSTS:?Missing SSH_KNOWN_HOSTS}"
[[ "$SSH_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]] || { echo 'Invalid SSH host' >&2; exit 1; }
[[ "$SSH_PORT" =~ ^[0-9]{1,5}$ ]] || { echo 'Invalid SSH port' >&2; exit 1; }
(( 10#$SSH_PORT >= 1 && 10#$SSH_PORT <= 65535 )) || { echo 'Invalid SSH port' >&2; exit 1; }
[[ "$SSH_USER" == 'chipsa' ]] || { echo 'Unexpected SSH user' >&2; exit 1; }
[[ "$FRAME_PACKAGE_DIR" == "$RUNNER_TEMP/frame-package" ]] || { echo 'Unexpected package path' >&2; exit 1; }
[[ -d "$FRAME_PACKAGE_DIR" && ! -L "$FRAME_PACKAGE_DIR" ]] || { echo 'Invalid theme package' >&2; exit 1; }
test -s "$FRAME_PACKAGE_DIR/functions.php"
test -s "$FRAME_PACKAGE_DIR/dist/css/style.min.css"
test -s "$FRAME_PACKAGE_DIR/dist/js/app.min.js"
command -v rsync >/dev/null

umask 077
ssh_directory=$(mktemp -d "$RUNNER_TEMP/frame-ssh.XXXXXX")
key_file="$ssh_directory/key"
known_hosts_file="$ssh_directory/known_hosts"
trap 'rm -f -- "$key_file" "$known_hosts_file"; rmdir -- "$ssh_directory"' EXIT
printf '%s\n' "$SSH_PRIVATE_KEY" | tr -d '\r' > "$key_file"
printf '%s\n' "$SSH_KNOWN_HOSTS" | tr -d '\r' > "$known_hosts_file"
ssh-keygen -y -P '' -f "$key_file" >/dev/null
lookup="$SSH_HOST"
if (( 10#$SSH_PORT != 22 )); then lookup="[$SSH_HOST]:$SSH_PORT"; fi
ssh-keygen -F "$lookup" -f "$known_hosts_file" >/dev/null

ssh_options=(
    -F /dev/null
    -i "$key_file"
    -p "$SSH_PORT"
    -o BatchMode=yes
    -o IdentitiesOnly=yes
    -o IdentityAgent=none
    -o StrictHostKeyChecking=yes
    -o "UserKnownHostsFile=$known_hosts_file"
    -o GlobalKnownHostsFile=/dev/null
    -o UpdateHostKeys=no
    -o ClearAllForwardings=yes
    -o ConnectTimeout=15
    -o ConnectionAttempts=1
    -o LogLevel=ERROR
)

# Read-only checks. Neither the theme nor its ancestors may resolve elsewhere.
ssh "${ssh_options[@]}" "$SSH_USER@$SSH_HOST" bash -s -- "$target" <<'REMOTE'
set -euo pipefail
expected='/var/www/chipsa/data/www/dnl.chipsa.ru/wp-content/themes/frame/'
[[ "$1" == "$expected" ]] || { echo 'Unexpected remote target' >&2; exit 1; }
target=${1%/}
if [[ -L "$target" ]]; then
    echo 'Staging directory is a symlink; refusing to follow it' >&2
    exit 1
fi
if [[ ! -d "$target" ]]; then
    echo 'Staging path is missing, inaccessible, or not a directory:' >&2
    stat --format='Target type: %F; permissions: %a; owner: %U:%G' -- "$target" >&2 || true
    exit 1
fi
[[ "$(realpath -e -- "$target")" == "$target" ]] || { echo 'Staging path resolves elsewhere' >&2; exit 1; }
cd -P -- "$target"
[[ "$PWD" == "$target" ]] || exit 1
[[ "$(id -un)" == 'chipsa' ]] || { echo 'Unexpected remote user' >&2; exit 1; }
[[ -r . && -x . && -w . ]] || { echo 'Insufficient staging directory permissions' >&2; exit 1; }
remote_link=$(find . -type l -print -quit)
[[ -z "$remote_link" ]] || { echo 'Unexpected symlink inside staging theme' >&2; exit 1; }
unwritable_directory=$(find . -type d ! -writable -print -quit)
[[ -z "$unwritable_directory" ]] || { echo 'Unwritable staging subdirectory' >&2; exit 1; }
command -v rsync >/dev/null
printf 'SSH user, staging path and directory permissions verified.\n'
REMOTE

# Repeat path guards in the receiver command, not only in the separate SSH check.
remote_directory=${target%/}
remote_guard="test -d '$remote_directory' && test ! -L '$remote_directory' && test \"\$(realpath -e -- '$remote_directory')\" = '$remote_directory' && cd -P -- '$remote_directory' && remote_link=\$(find . -type l -print -quit) && test -z \"\$remote_link\""
remote_rsync="$remote_guard && exec rsync"
printf -v ssh_command '%q ' ssh "${ssh_options[@]}"
rsync \
    --archive --no-owner --no-group \
    --checksum --delay-updates --itemize-changes --stats --human-readable \
    --protect-args --chmod=D755,F644 \
    --rsh="$ssh_command" \
    --rsync-path="$remote_rsync" \
    "$FRAME_PACKAGE_DIR/" "$SSH_USER@$SSH_HOST:$target"

# Compare every deployed file with this exact local package, without writing a
# manifest on the VPS. The receiver guards are repeated before reading files.
manifest="$RUNNER_TEMP/frame-package.sha256"
(
    cd -- "$FRAME_PACKAGE_DIR"
    find . -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum
) > "$manifest"
remote_verify="$remote_guard && test -s style.css && test -s functions.php && test -s index.php && test -s header.php && test -s footer.php && test -s front-page.php && test -s dist/css/style.min.css && test -s dist/js/app.min.js && sha256sum --check --strict --quiet"
ssh "${ssh_options[@]}" "$SSH_USER@$SSH_HOST" "$remote_verify" < "$manifest"
printf 'All deployed package files verified against SHA-256 manifest.\n'
