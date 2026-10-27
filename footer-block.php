<?php
$form_title = get_localized_field('footer_zagolovok_formy');
$info = get_localized_field('footer_informacziya');
$copyright = get_localized_field('footer_kopirajt');
$privacy = get_localized_field('footer_politika');
$cookies = get_localized_field('footer_kuki');
?>
<footer class="footer" data-dark>
    <div class="footer__container _container">
        <div class="footer__body">
            <div class="footer__top footer__grid">
                <div class="footer__left">
                    <h4><?php echo $form_title ?></h4>

                    <div class="form">
                        <?php echo do_shortcode('[contact-form-7 id="dac4f0e"]') ?>
                    </div>
                </div>
                <div class="footer__right">
                    <?php echo get_locate_menu('primary'); ?>

                    <div class="footer__social _social">
                        <?php get_template_part('template-parts/social-links') ?>
                    </div>
                </div>
            </div>
            <div class="footer__bottom footer__grid">
                <div class="footer__left">
                    <a href="<?php echo get_home_page_url() ?>" width="430" height="80" class="footer__logo h2">
                        <img src="<?php echo esc_url(frame_asset('img/logo-black.svg')); ?>" alt="<?php echo bloginfo('name') ?>">
                    </a>
                </div>
                <div class="footer__right">
                    <p class="footer__info text-m"><?php echo $info ?></p>
                    <p class="footer__copyright text-s">© <?php echo date('Y') ?> <?php echo $copyright ?></>
                    <div>
                        <?php
                        echo get_link_info($privacy, 'text-s footer__privacy');
                        echo get_link_info($cookies, 'text-s footer__cookies');
                        ?>

                        <a href="<?php echo get_chipsa_project_url() ?>"
                            target="_blank" rel="nofollow" class="chipsa text-m">
                            Made in
                            <img src="<?php echo esc_url(frame_asset('img/icons/chipsa.svg')); ?>" alt="">
                            Chipsa
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</footer>
</div>