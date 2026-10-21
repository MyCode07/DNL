<?php

function frame_is_vite_dev(): bool
{
    return wp_get_environment_type() === 'local'
        && defined('WP_VITE_DEV')
        && WP_VITE_DEV === true;
}

function frame_asset(string $path): string
{
    $path = ltrim($path, '/');

    // The generated sprite lives in dist, including in the local environment.
    $assetPath = substr($path, 0, strcspn($path, '?#'));
    if ($assetPath === 'img/svg/icons.svg') {
        return get_theme_file_uri('dist/' . $path);
    }

    if (frame_is_vite_dev()) {
        return 'http://localhost:4040/' . $path;
    }

    return get_theme_file_uri('dist/' . $path);
}
