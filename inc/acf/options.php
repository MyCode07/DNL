<?php

// acf exists
if (function_exists('acf_add_options_page')) {
    acf_add_options_page(array(
        'page_title'     => 'Редактирование общих полей',
        'menu_title'    => 'Общие поля',
        'menu_slug'     => 'theme-general-settings',
        'capability'    => 'edit_posts',
        'redirect'        => false
    ));


    // fix acf path issue
    add_filter('block_editor_rest_api_preload_paths', 'acf_filter_rest_api_preload_paths', 10, 1);
    function acf_filter_rest_api_preload_paths($preload_paths)
    {
        global $post;
        $rest_path   = rest_get_route_for_post($post);
        $remove_path = add_query_arg('context', 'edit', $rest_path);

        return array_filter(
            $preload_paths,
            function ($url) use ($remove_path) {
                return $url !== $remove_path;
            }
        );
    }


    // Создаем отдельные пункты меню для каждой ACF Options страницы
    add_action('admin_menu', 'add_acf_options_menu');
    function add_acf_options_menu()
    {
        $template = 'pages/acf-options-page.php';

        $pages = get_pages(array(
            'meta_key' => '_wp_page_template',
            'meta_value' => $template
        ));

        if (!empty($pages)) {
            foreach ($pages as $page) {
                // Каждая страница как отдельный пункт меню
                add_menu_page(
                    $page->post_title,                 // Page title
                    $page->post_title,                 // Menu title
                    'manage_options',                  // Capability
                    'post.php?post=' . $page->ID . '&action=edit', // Menu slug
                    '',                                // Callback
                    'dashicons-admin-generic',         // Icon
                    30                                 // Position
                );
            }
        }
    }


    add_action('template_redirect', 'redirect_acf_pages_to_404');
    function redirect_acf_pages_to_404()
    {
        global $post;
        global $wp_query;

        if (!$post instanceof WP_Post) {
            return;
        }

        $slug = get_page_template_slug($post->ID);
        if ($slug == 'pages/acf-options-page.php') {
            $wp_query->set_404();
        }
    }

    // Отключаем редактор и блоки Yoast
    add_action('admin_init', 'remove_editor_and_yoas');
    function remove_editor_and_yoas()
    {
        $post_id = isset($_GET['post']) ? intval($_GET['post']) : (isset($_POST['post_ID']) ? intval($_POST['post_ID']) : 0);
        if (! $post_id) {
            return;
        }

        $template_file = get_post_meta($post_id, '_wp_page_template', true);
        if ($template_file == 'pages/acf-options-page.php') {
            remove_post_type_support('page', 'editor');
            add_action('add_meta_boxes', 'remove_yoast_metabox', 99);
        }
    }
    function remove_yoast_metabox()
    {
        remove_meta_box('wpseo_meta', 'page', 'normal');
    }

    // get_options_field('knopka_shapki');
    function get_options_field($field)
    {
        $slug = 'acf-options';

        if (function_exists('pll_current_language')) {
            $default = pll_default_language();
            $current = pll_current_language();

            if ($current !== $default) {
                $slug =  $current .= '-' . $slug;
            }
        }

        $page = get_page_by_path($slug);

        if (!$page) {
            return;
        }

        return get_field($field, $page->ID);
    }


    function get_home_page_url()
    {

        $home_url = home_url();

        if (function_exists('pll_home_url')) {
            $home_url = pll_home_url();
        }

        return esc_url($home_url);
    }
}
