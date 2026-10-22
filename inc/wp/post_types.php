<?php

add_action('init', 'custom_posts_and_taxonomies');
function custom_posts_and_taxonomies()
{

    register_post_type('publication', array(
        'labels' => array(
            'name'               => 'Публикации',
            'menu_name'          => 'Публикации',
            'singular_name'      => 'Публикация',
            'all_items'          => 'Все публикации',
            'name_admin_bar'     => 'Добавить новую',
            'add_new'            => 'Добавить новую',
            'add_new_item'       => 'Добавить новую публикацию',
            'edit_item'          => 'Редактировать публикацию',
            'view_item'          => false,
            'search_items'       => 'Искать публикации',
            'no_found'           => 'Публикации не найдены',
            'not_found_in_trash' => 'Empty Trash'
        ),
        'exclude_from_search' => true,
        'public'              => true,
        'publicly_queryable'  => true,
        'show_ui'             => true,
        'show_in_rest'        => false,
        'query_var'           => true,
        'show_in_nav_menus'   => true,
        'capability_type'     => 'post',
        'hierarchical'        => false,
        'rewrite'             => array('slug' => 'publications', 'with-front' => false),
        'supports'            => array('title', 'thumbnail', 'editor', 'page-attributes'),
        'has_archive'         => false,
        'menu_icon'           => 'dashicons-analytics',
    ));

    register_post_type('popup', array(
        'labels' => array(
            'name'               => 'Попапы',
            'menu_name'          => 'Попапы',
            'singular_name'      => 'Попап',
            'all_items'          => 'Все попапы',
            'name_admin_bar'     => 'Добавить новый',
            'add_new'            => 'Добавить новый',
            'add_new_item'       => 'Добавить новый попап',
            'edit_item'          => 'Редактировать попап',
            'view_item'          => false,
            'search_items'       => 'Искать попапы',
            'no_found'           => 'Попапы не найдены',
            'not_found_in_trash' => 'Empty Trash'
        ),
        'exclude_from_search' => true,
        'public'              => true,
        'publicly_queryable'  => false,
        'show_ui'             => true,
        'show_in_rest'        => false,
        'query_var'           => true,
        'show_in_nav_menus'   => true,
        'capability_type'     => 'post',
        'hierarchical'        => false,
        'rewrite'             => array('slug' => 'popup'),
        'supports'            => array('title', 'page-attributes'),
        'has_archive'         => false,
        'menu_icon'           => 'dashicons-visibility',
    ));
}
