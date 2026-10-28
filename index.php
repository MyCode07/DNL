<?php
get_header();
?>

<main>
    <?php
    $blog_page_id = get_option('page_for_posts');
    $posts_per_page = get_option('posts_per_page') ?? 6;
    global $wp_query;
    ?>

    <section class="section text-page archive archive-publications">
        <div class="section__container _container">
            <div class="section__body">
                <div class="section__top">
                    <h1 class="h2"><?php echo get_the_title($blog_page_id) ?></h1>
                    <div class="line"><span></span></div>
                </div>

                <?php if (have_posts()): ?>
                    <div class="grid grid-3" data-posts-container>
                        <?php

                        while (have_posts()) {
                            the_post();
                            get_template_part('template-parts/post-cards/post');
                        }
                        ?>
                    </div>
                    <?php
                    if (max(1, (int) get_query_var('paged')) < $wp_query->max_num_pages) {
                        get_template_part('template-parts/load-more-btn');
                    }
                    ?>
                <?php else:
                    get_template_part('template-parts/content-none');
                endif; ?>
            </div>
        </div>
    </section>

</main>

<?php
get_footer();
