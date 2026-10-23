<section class="section publications <?php echo esc_attr($args['class'] ?? ''); ?>" id="publications" data-dark>
    <div class="section__container _container">
        <div class="section__body">
            <div class="section__top">
                <div class="section__top-flex">
                    <h2>Публикации</h2>
                    <?php if (is_front_page()): ?>
                        <a href="/publikaczii/" class="arrow-btn text-m">
                            Смотреть все
                            <svg width="13" height="10" viewBox="0 0 13 10">
                                <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#menu-btn-arrow')); ?>' />
                            </svg>
                        </a>
                    <?php endif; ?>
                </div>
                <div class="line"></div>
            </div>
            <div class="swiper">
                <div class="swiper-wrapper">
                    <div class="swiper-slide">
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
                    </div>
                    <div class="swiper-slide">
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
                    </div>
                    <div class="swiper-slide">
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
                    </div>
                    <div class="swiper-slide">
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
                    </div>
                </div>
            </div>
            <div class="swiper-navigation">
                <button class="prev">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#swiper-arrow')); ?>' />
                    </svg>
                </button>
                <button class="next">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#swiper-arrow')); ?>' />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</section>