<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
    <?php
    wp_body_open();
    $header_class = '';

    if (!is_front_page() && !is_404()) {
        $header_class = ' dark-static header-page header-scrolled';
    }
    if (is_404()) {
        $header_class = ' header-page';
    }
    ?>
    <div class="wrapper">
        <?php if (!is_front_page() && !is_404()) {
            get_template_part('template-parts/breadcrumbs');
        }
        ?>
        <header class="header white _fixed <?php echo $header_class ?>">
            <div class="header__container _container">
                <div class="header__body">
                    <a href="/" class="header__logo">
                        <img src="<?php echo esc_url(frame_asset('img/logo.svg')); ?>" class="_desktop" alt="DNL Capital — главная">
                        <img src="<?php echo esc_url(frame_asset('img/logo-mb.svg')); ?>" class="_mobile" alt="DNL Capital — главная">
                    </a>
                    <?php get_template_part('template-parts/menu') ?>
                </div>
            </div>
        </header>