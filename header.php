<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
    <?php wp_body_open(); ?>
    <div class="wrapper">
        <header class="header white _fixed @@class">
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