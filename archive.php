<?php
get_header();
?>

<main id="main">

    <?php
    $archive_class = '';
    global $wp_query;

    if (is_category()) {
        $cat = get_queried_object();
        $archive_class = 'archive-category-' . $cat->slug;
    } elseif (is_tag()) {
        $tag = get_queried_object();
        $archive_class = 'archive-tag-' . $tag->slug;
    } elseif (is_tax()) {
        $tax = get_queried_object();
        $archive_class = 'archive-taxonomy-' . $tax->taxonomy . '-' . $tax->slug;
    }
    ?>
    <section class="section text-page archive <?php echo $archive_class ?>">
        <div class="section__container _container">
            <div class="section__body">
                <div class="section__top">
                    <h1 class="h2"><?php the_archive_title() ?></h1>
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
                    echo my_pagenavi();
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
