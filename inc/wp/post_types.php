<?php

add_action('init', 'custom_posts_and_taxonomies');
function custom_posts_and_taxonomies()
{

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
        'show_in_nav_menus'   => false,
        'capability_type'     => 'post',
        'hierarchical'        => false,
        'rewrite'             => array('slug' => 'popup'),
        'supports'            => array('title', 'page-attributes'),
        'has_archive'         => false,
        'menu_icon'           => 'dashicons-visibility',
    ));

    register_post_type('project', array(
        'labels' => array(
            'name'               => 'Проекты',
            'menu_name'          => 'Проекты',
            'singular_name'      => 'Проект',
            'all_items'          => 'Все Проект',
            'name_admin_bar'     => 'Добавить новый',
            'add_new'            => 'Добавить новый',
            'add_new_item'       => 'Добавить новый Проект',
            'edit_item'          => 'Редактировать Проект',
            'view_item'          => false,
            'search_items'       => 'Искать Проекты',
            'no_found'           => 'Проекты не найдены',
            'not_found_in_trash' => 'Empty Trash'
        ),
        'exclude_from_search' => true,
        'public'              => true,
        'publicly_queryable'  => false,
        'show_ui'             => true,
        'show_in_rest'        => false,
        'query_var'           => true,
        'show_in_nav_menus'   => false,
        'capability_type'     => 'post',
        'hierarchical'        => false,
        'rewrite'             => array('slug' => 'projects'),
        'supports'            => array('title', 'page-attributes'),
        'has_archive'         => false,
        'menu_icon'           => 'dashicons-building',
    ));
}
