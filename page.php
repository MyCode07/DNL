<?php
get_header();
?>

<main id="main">

    <section class="section text-page" id="page-<?php the_ID() ?>">
        <div class="section__container _container">
            <div class="section__body">
                <div class="section__top">
                    <h1 class="h2"><?php the_title() ?></h1>
                    <div class="line"><span></span></div>
                </div>
                <div class="text-box">
                    <?php the_content() ?>
                </div>
            </div>
        </div>
    </section>

</main>

<?php
get_footer();
