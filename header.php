<!DOCTYPE html>
<html class="no-js" <?php language_attributes(); ?>>

<head>
    <script>
        document.documentElement.classList.replace('no-js', 'js');
        window.frameRevealStartedAt = performance.now();
        window.addEventListener('load', () => {
            if (!window.frameElementRevealReady) {
                document.documentElement.classList.add('reveal-disabled');
            }
        }, { once: true });
    </script>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <?php get_template_part('template-parts/page-transition'); ?>
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


    <?php
    $columns = 20;
    $rows = 12;
    ?>

    <div
        class="page-transition"
        data-reveal-delay="1200"
        aria-hidden="true"
        style="--columns: <?= $columns ?>;
         --rows: <?= $rows ?>;">
        <?php for ($y = 0; $y < $rows; $y++): ?>
            <?php for ($x = 0; $x < $columns; $x++): ?>
                <span
                    class="page-transition__tile"
                    style="
          --row: <?= $y ?>;
          --random: <?= mt_rand(0, 100) / 100 ?>;
        "></span>
            <?php endfor; ?>
        <?php endfor; ?>
    </div>
    <style>
        .page-transition {
            position: fixed;
            inset: 0;
            z-index: 99999;

            display: grid;
            grid-template-columns: repeat(var(--columns), 1fr);
            grid-template-rows: repeat(var(--rows), 1fr);

            pointer-events: none;
        }

        .page-transition__tile {
            background: #000;

            animation-name: tile-reveal;
            animation-duration: 0s;
            animation-fill-mode: both;

            animation-delay: calc(var(--row) * 50ms + var(--random) * 100ms);
        }

        @keyframes tile-reveal {
            from {
                opacity: 1;
            }

            to {
                opacity: 0;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .page-transition__tile {
                animation: none;
                opacity: 0;
            }
        }
    </style>


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
