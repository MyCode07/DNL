<?php
get_header();
?>

<main>

    <?php
    $err = get_localized_field('stranicza_404');
    ?>
    <section class="section error-404 mb0">
        <div class="img">
            <img class="db-1025" src="<?php echo esc_url(frame_asset('img/404.png')); ?>" alt="">
            <img class="dn-1025" src="<?php echo esc_url(frame_asset('img/404-1024.png')); ?>" alt="">
        </div>
        <div class="section__container _container">
            <div class="section__body">
                <h1 class="h4"><?php echo $err['zagolovok'] ?></h1>
                <a href="<?php echo get_home_page_url() ?>" class="_btn _btn-white primary-button">
                    <?php echo frame_button_layers(); ?>
                    <?php echo $err['tekst_knopki'] ?>
                </a>
            </div>
        </div>
    </section>

</main>

<?php
get_footer();
