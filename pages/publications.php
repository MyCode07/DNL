<?php
/*
Template Name: custom-archive
Template Post Type: page
*/
get_header();
?>

<main>
    <section class="section text-page archive">
        <div class="section__container _container">
            <div class="section__body">
                <div class="breadcrumbs text-m">
                    <ul class="breadcrumb">
                        <li>
                            <a href="/">Главная</a>
                            <div class="sep"></div>
                        </li>
                        <li>
                            <span>Публикации</span>
                        </li>
                    </ul>
                </div>
                <div class="section__top">
                    <h1 class="h2">Публикации</h1>
                    <div class="line"></div>
                </div>

                <div class="grid grid-3" data-post-container data-post-type="publication" data-count="6">
                    <?php
                    $posts = new WP_Query([
                        'post_type' => 'publication',
                        'posts_per_page' => 6,
                        'orderby' => 'date',
                        'order' => 'ASC'
                    ]);

                    while ($posts->have_posts()) {
                        $posts->the_post();
                        get_template_part('template-parts/post-cards/post');
                        get_template_part('template-parts/post-cards/post');
                        get_template_part('template-parts/post-cards/post');
                        get_template_part('template-parts/post-cards/post');
                        get_template_part('template-parts/post-cards/post');
                        get_template_part('template-parts/post-cards/post');
                    }
                    wp_reset_postdata();
                    ?>
                </div>
                <!-- <php if ($posts->found_posts > 6): ?> -->
                <button class="arrow-btn load-more text-m" data-text-static="Загрузить ещё" data-text-loading="Загрузка...">Загрузить
                    ещё</button>
                <!-- <php endif; ?> -->
            </div>
        </div>
    </section>

</main>

<?php
get_footer();
