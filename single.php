<?php
get_header();
?>

<main>
    <?php while (have_posts()) : the_post(); ?>
        <article class="section text-page single" id="post-<?php the_ID(); ?>">
            <div class="section__container _container">
                <div class="section__body">
                    <div class="single-grid">
                        <div class="section__top">
                            <h1 class="h2"><?php the_title() ?></h1>
                            <div class="line"><span></span></div>
                        </div>
                        <div class="single-data">
                            <div class="single-data__items">
                                <?php get_template_part('template-parts/single-post/categories') ?>
                                <div class="single-data__double">
                                    <?php get_template_part('template-parts/single-post/author') ?>
                                    <?php get_template_part('template-parts/single-post/expert') ?>
                                </div>
                                <?php get_template_part('template-parts/single-post/date') ?>
                            </div>
                            <?php get_template_part('template-parts/single-post/share', null, ['class' => '_desktop']) ?>
                        </div>
                        <div class="single-content">
                            <?php if (has_post_thumbnail()): ?>
                                <?php $thumbnail_caption = wp_get_attachment_caption(get_post_thumbnail_id()); ?>
                                <div class="img">
                                    <figure>
                                        <?php the_post_thumbnail('full'); ?>
                                        <?php if ($thumbnail_caption): ?>
                                            <figcaption><?php echo esc_html($thumbnail_caption); ?></figcaption>
                                        <?php endif; ?>
                                    </figure>
                                </div>
                            <?php endif; ?>
                            <div class="text-box">
                                <?php if (has_excerpt(get_the_ID())): ?>
                                    <div class="project-name"><?php echo get_the_excerpt(); ?></div>
                                <?php endif; ?>
                                <?php the_content() ?>
                            </div>
                            <?php get_template_part('template-parts/single-post/share', null, ['class' => '_mobile']) ?>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    <?php endwhile; ?>

    <?php get_template_part('template-parts/sections/posts', null, ['class' => 'pt0']); ?>

</main>

<?php
get_footer();
