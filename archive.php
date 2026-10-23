<?php
get_header();
?>

<main>

    <section class="section text-page archive">
        <div class="section__container _container">
            <div class="section__body">
                <div class="section__top">
                    <h1 class="h2">Публикации</h1>
                    <div class="line"></div>
                </div>

                <div class="grid grid-3" data-post-container data-post-type="publications" data-count="6">
                    <?php get_template_part('template-parts/post-cards/post'); ?>
                </div>
                <button class="arrow-btn load-more text-m" data-text-static="Загрузить ещё" data-text-loading="Загрузка...">Загрузить
                    ещё</button>
            </div>
        </div>
    </section>

</main>

<?php
get_footer();
