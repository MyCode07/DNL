<?php
get_header();
?>

<main>

    <section class="section text-page">
        <div class="section__container _container">
            <div class="section__body">
                <div class="breadcrumbs text-m">
                    <ul class="breadcrumb">
                        <li>
                            <a href="/">Главная</a>
                            <div class="sep"></div>
                        </li>
                        <li>
                            <span>Политика в отношении обработки персональных данных</span>
                        </li>
                    </ul>
                </div>
                <div class="section__top">
                    <h1 class="h2"><?php the_title() ?></h1>
                    <div class="line"></div>
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
