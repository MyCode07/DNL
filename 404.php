<?php
get_header();
?>

<main>

    <section class="section error-404 mb0">
        <div class="img">
            <img class="db-1025" src="<?php echo esc_url(frame_asset('img/404.png')); ?>" alt="">
            <img class="dn-1025" src="<?php echo esc_url(frame_asset('img/404-1024.png')); ?>" alt="">
        </div>
        <div class="section__container _container">
            <div class="section__body">
                <h1 class="h4">Возможно неправильно набран адрес, или такой страницы больше не существует</h1>
                <a href="/" class="_btn _btn-white primary-button">
                    Вернуться<br>на главную
                </a>
            </div>
        </div>
    </section>

</main>

<?php
get_footer();
