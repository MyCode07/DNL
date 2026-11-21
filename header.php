<!DOCTYPE html>
<html class="no-js" <?php language_attributes(); ?>>

<head>
    <script>
        document.documentElement.classList.replace('no-js', 'js');
        window.addEventListener('load', () => {
            if (!window.frameElementRevealReady) {
                document.documentElement.classList.add('reveal-disabled');
            }
        }, {
            once: true
        });
    </script>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <?php if (preg_match('/\biPhone\b/i', $_SERVER['HTTP_USER_AGENT'] ?? '')) : ?>
        <meta name="theme-color" content="#000">
    <?php endif; ?>
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
    <?php get_template_part('template-parts/page-transition'); ?>
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
        <header class="header white <?php echo $header_class ?>">
            <div class="header__container _container">
                <div class="header__body">
                    <a href="<?php echo get_home_page_url() ?>" class="header__logo">
                        <img src="<?php echo esc_url(frame_asset('img/logo.svg')); ?>" class="_desktop" width="128" height="24" alt="<?php echo bloginfo('name') ?>">
                        <img src="<?php echo esc_url(frame_asset('img/logo-mb.svg')); ?>" class="_mobile" width="50" height="20" alt="<?php echo bloginfo('name') ?>">
                    </a>
                    <?php get_template_part('template-parts/menu') ?>
                </div>
            </div>
        </header>