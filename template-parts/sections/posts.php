<?php
$publications = get_field('publikaczii');
$publications_link_url = '';
$publications_link_text = '';

if ($publications) {
    $all_publications = $publications['ssylka'];
    $title = $publications['zagolovok'];

    $posts = get_posts_custom([
        'post_type' => 'post',
        'posts__in' => $publications['spisok'] ?? false,
        'orderby' => $publications['spisok'] ? 'posts__in' : 'menu_order',
        'order' => 'ASC',
        'count' => $publications['spisok'] ? count($publications['spisok']) : 6,
        'slide' => true,
    ]);

    $publications_link_url = $all_publications['url'] ?? '';
    $publications_link_text = $all_publications['title'] ?? '';
}

if (is_singular('post')) {
    $post_id = get_the_ID();
    $title = get_localized_field('zagolovok_pohozhih_publikaczij');
    $category_ids = wp_get_post_categories($post_id);

    $posts = get_posts_custom([
        'post_type' => 'post',
        'tax_query' => [
            [
                'taxonomy' => 'category',
                'field'    => 'term_id',
                'terms'    => $category_ids,
                'operator' => 'IN',
            ],
        ],
        'orderby' => 'menu_order',
        'order' => 'ASC',
        'count' => 6,
        'slide' => true,
        'exclude' => $post_id,
    ]);

    $publications = get_field('publikaczii', get_option('page_on_front'));
    $link = $publications['ssylka'] ?? [];

    $publications_link_url = $link['url'] ?? '';
    $publications_link_text = $link['title'] ?? '';
}
?>
<section class="section publications <?php echo esc_attr($args['class'] ?? ''); ?>" id="publications" data-dark>
    <div class="section__container _container">
        <div class="section__body">
            <div class="section__top">
                <div class="section__top-flex">
                    <h2><?php echo $title ?></h2>
                    <?php if ($publications_link_url): ?>
                        <a href="<?php echo esc_url($publications_link_url) ?>" class="arrow-btn text-m">
                            <?php echo esc_html($publications_link_text) ?>
                            <svg width="13" height="10" viewBox="0 0 13 10">
                                <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#menu-btn-arrow')); ?>' />
                            </svg>
                        </a>
                    <?php endif; ?>
                </div>
                <div class="line"><span></span></div>
            </div>
            <div class="swiper">
                <div class="swiper-wrapper">
                    <?php echo $posts; ?>
                </div>
            </div>
            <?php get_template_part('template-parts/swiper-navigation') ?>
        </div>
    </div>
</section>
