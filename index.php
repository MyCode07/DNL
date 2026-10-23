<?php
get_header();
?>

<main>
    <section class="section text-page archive">
        <div class="section__container _container">
            <div class="section__body">
                <div class="section__top">
                    <h1 class="h2">Публикации</h1>
                    <div class="line"><span></span></div>
                </div>

                <div class="grid grid-3" data-post-container data-post-type="post" data-count="6">
                    <?php
                    $posts = new WP_Query([
                        'post_type' => 'post',
                        'posts_per_page' => 6,
                        'orderby' => 'date',
                        'order' => 'ASC'
                    ]);

                    while ($posts->have_posts()) {
                        $posts->the_post();
                        get_template_part('template-parts/post-cards/post');
                    ?>
                        <article class="post-item">
                            <div class="post-item__data label-m">
                                <div>
                                    <span class="post-item__author label-m">Андрей Волков — 24 Сен. 2026</span>
                                </div>
                            </div>
                            <h4><a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/">Взгляд на рынок: экосистема ИИ, IPO и недвижимость</a></h4>
                            <a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/" class="img">
                                <div class="post-item__labels">
                                    <span class="label-m">Технологии и рынок</span>
                                </div>
                                <img src="<?php echo esc_url(frame_asset('img/post-1.png')); ?>" alt="">
                            </a>
                            <p>О чем говорит статус Blackstone как одногоиз крупнейших поставщиков частного капитала
                                для экосистемы искусственно...</p>
                        </article>
                        <article class="post-item">
                            <div class="post-item__data label-m">
                                <div>
                                    <span class="post-item__author label-m">Мария Орлова — 24 Сен. 2026</span>
                                </div>
                            </div>
                            <h4><a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/">Где же отдача? Денис Лагутенкоиз DNL Capital — о результатах
                                    масштабных...</a></h4>
                            <a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/" class="img">
                                <div class="post-item__labels">
                                    <span class="label-m">Эффективность капитала</span>
                                </div>
                                <img src="<?php echo esc_url(frame_asset('img/post-2.png')); ?>" alt="">
                            </a>
                            <p>Скептики сомневаются</p>
                        </article>
                        <article class="post-item">
                            <div class="post-item__data label-m">
                                <div>
                                    <span class="post-item__author label-m">Илья Кузнецов — 21 Сен. 2026</span>
                                </div>
                            </div>
                            <h4><a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/">Инвестиционный прогноз</a></h4>
                            <a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/" class="img">
                                <div class="post-item__labels">
                                    <span class="label-m">Прогнозы</span>
                                </div>
                                <img src="<?php echo esc_url(frame_asset('img/post-3.png')); ?>" alt="">
                            </a>
                            <p>Примечательно, что в сфере искусственного интеллекта (ИИ) — нашей ключевой тематике —
                                наблюдается искл...</p>
                        </article>
                        <article class="post-item">
                            <div class="post-item__data label-m">
                                <div>
                                    <span class="post-item__author label-m">Анна Белова — 17 Сен. 2026</span>
                                </div>
                            </div>
                            <h4><a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/">Как формируется доходность</a></h4>
                            <a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/" class="img">
                                <div class="post-item__labels">
                                    <span class="label-m">Недвижимость</span>
                                </div>
                                <img src="<?php echo esc_url(frame_asset('img/post-4.png')); ?>" alt="">
                            </a>
                            <p>Разбираем, как реконцепция...</p>
                        </article>
                    <?php
                    }
                    wp_reset_postdata();
                    ?>
                </div>
                <!-- <php if ($posts->found_posts > 6): ?> -->
                <button class="arrow-btn load-more text-m" data-text-static="Загрузить ещё" data-text-loading="Загрузка...">Загрузить
                    ещё</button>
                <!-- <php endif; ?> -->
            </div>
        </div>
    </section>

</main>

<?php
get_footer();
