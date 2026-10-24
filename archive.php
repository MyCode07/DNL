<?php
get_header();
?>

<main>

    <section class="section text-page archive">
        <div class="section__container _container">
            <div class="section__body">
                <div class="section__top">
                    <h1 class="h2"><?php the_archive_title() ?></h1>
                    <div class="line"><span></span></div>
                </div>

                <?php if (have_posts()): ?>
                    <div class="grid grid-3" data-post-container data-post-type="<?php echo get_post_type() ?>" data-count="6">
                        <?php
                        while (have_posts()) {
                            the_post();
                            get_template_part('template-parts/post-cards/post');
                        }
                        ?>
                    </div>
                    <!-- <php if ($posts->found_posts > 6): ?> для глобал квери -->
                    <?php get_template_part('template-parts/load-more-btn') ?>
                    <!-- <php endif; ?> -->
                <?php else:
                    get_template_part('template-parts/content-none');
                endif; ?>
            </div>
        </div>
    </section>

</main>

<?php
get_footer();
