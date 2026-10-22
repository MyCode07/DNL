<?php

add_filter( 'wpseo_sitemap_entry', 'exclude_yoast_sitemap_by_template', 10, 3 );
function exclude_yoast_sitemap_by_template( $url, $type, $post ) {
    if ( isset( $post->ID ) ) {

        $current_template = get_page_template_slug( $post->ID );
        $target_template = 'pages/acf-options-page.php';

        if ( $current_template === $target_template ) {
            return array(); // Удаляет страницу из карты сайта
        }
    }

    return $url;
}
