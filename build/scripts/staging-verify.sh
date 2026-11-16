#!/usr/bin/env bash
set -euo pipefail

: "${STAGING_URL:?Missing STAGING_URL}"
: "${RUNNER_TEMP:?Missing runner temporary directory}"
: "${GITHUB_SHA:?Missing deployment commit}"
[[ "$STAGING_URL" =~ ^https://[a-zA-Z0-9][a-zA-Z0-9.-]*(:[0-9]{1,5})?/?$ ]] || { echo 'STAGING_URL must be an HTTPS origin' >&2; exit 1; }
[[ "$GITHUB_SHA" =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid deployment commit' >&2; exit 1; }
if [[ "${1:-}" == '--validate' ]]; then exit 0; fi
base_url=${STAGING_URL%/}
curl_options=(--silent --show-error --location --max-redirs 5
    --connect-timeout 15 --max-time 60 --retry 2 --retry-max-time 120
    --proto '=https' --proto-redir '=https')
homepage_status=$(curl "${curl_options[@]}" --output "$RUNNER_TEMP/staging-home.html" \
    --write-out '%{http_code}' "$base_url/")
case "$homepage_status" in
    2??) printf 'Staging homepage HTTP %s\n' "$homepage_status" ;;
    401) echo 'Staging homepage HTTP 401: intentional authentication protection; application content not checked.' ;;
    *) printf 'Unexpected staging homepage HTTP %s\n' "$homepage_status" >&2; exit 1 ;;
esac
for asset in css/style.min.css js/app.min.js; do
    output="$RUNNER_TEMP/staging-$(basename "$asset")"
    curl "${curl_options[@]}" --fail --output "$output" \
        "$base_url/wp-content/themes/frame/dist/$asset?frame_deploy=$GITHUB_SHA"
    cmp -- "$output" "$RUNNER_TEMP/frame-package/dist/$asset"
    printf 'Deployed asset verified over HTTPS: %s\n' "$asset"
done
echo 'HTTP availability does not confirm theme activation or visual correctness.'
