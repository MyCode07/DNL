<?php
get_header();
?>

<main>

    <section class="hero white">
        <div class="hero__bg">
            <div class="hero__bg-image"></div>
        </div>
        <div class="hero__container _container">
            <div class="hero__body">
                <div class="hero__content">
                    <h1>Инвестиции<br>в недвижимость<br>США</h1>
                    <p class="h1-subtitle">DNL Capital — инвестиционная компания всфере недвижимостиСША.
                        Мыинвестируем капитал компании впроекты спонятной экономикой ипотенциалом роста стоимости.
                    </p>
                    <div class="hero__button">
                        <button class="_btn _btn-white primary-button" data-open-popup="propose">
                            Предложить<br>проект
                        </button>
                    </div>
                </div>

                <div class="glass__grid">
                    <div class="glass__grid-item">
                        <h4>Первая<br>сделка</h4>
                        <p class="big-nums">2021</p>
                    </div>
                    <div class="glass__grid-item">
                        <h4>Инвестиционные<br>стратегии</h4>
                        <p class="big-nums">3</p>
                    </div>
                    <div class="glass__grid-item">
                        <h4>Инвестиционные<br>кейсы</h4>
                        <p class="big-nums">3</p>
                    </div>
                    <div class="glass__grid-item ">
                        <h4>Основной<br>рынок</h4>
                        <p class="big-nums">США</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="pixelated-scroll-transition" data-pixelated-scroll-transition data-color="#ffffff"
            data-direction="down" aria-hidden="true">
        </div>
    </section>

    <section class="section criteria pb0" id="criteria" data-dark>
        <div class="section__container _container">
            <div class="section__body">
                <div class="section__top">
                    <h2><span>DNL Capital рассматривает</span>
                        недвижимость <span> прежде всего</span> как инвестиционный инструмент</h2>
                    <div class="line"><span></span></div>
                    <p>Работаем с разными форматами сделок: приобретениеи перепродажа, девелопмент, арендный доход,
                        повышение стоимости объектов и освоение земельных участков. Стратегия зависит от конкретного
                        актива.</p>
                </div>
                <div class="_label label-uppercase-m">Ключевые критерии</div>
                <div class="criteria-items">
                    <div class="criteria-item">
                        <span class="medium-nums">01</span>
                        <h3>Сделка имеет
                            ясное экономическое
                            обоснование</h3>
                        <div class="img">
                            <img src="<?php echo esc_url(frame_asset('img/criteria-1.png')); ?>" alt="">
                        </div>
                    </div>
                    <div class="criteria-item">
                        <span class="medium-nums">02</span>
                        <h3>Потенциал
                            создания ценности</h3>
                        <div class="img">
                            <img src="<?php echo esc_url(frame_asset('img/criteria-2.png')); ?>" alt="">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="section projects" id="projects" data-tab-area="10000" data-dark>
        <div class="section__container _container">
            <div class="section__body">
                <div class="section__top">
                    <h2>Проекты</h2>
                    <div class="line"><span></span></div>
                </div>
                <div class="projects-wrap">
                    <div data-tab-content="0" class="_active">
                        <div class="projects-item grid grid-3">
                            <div class="projects-item__content">
                                <div class="project-name">Residential <br> Investment</div>
                                <div class="projects-item__labels">
                                    <div class="loc label-m"><span>Florida, USA</span> <span>2021–2022</span></div>
                                </div>
                                <div class="projects-item__description" id="project-description-1">
                                    <p>Первый инвестиционный кейс DNL Capital. Жилой объект был приобретён в январе 2021
                                        года
                                        за $1.25 млн и продан в феврале 2022 года за $1.85 млн.</p>
                                </div>
                                <button type="button" class="projects-item__description-toggle"
                                    data-text-open="Читать описание" data-text-close="Скрыть" aria-expanded="true"
                                    aria-controls="project-description-1" hidden>
                                    <span data-description-label class="text-m"></span>
                                    <svg width="16" height="12" viewBox="0 0 16 12">
                                        <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#description-toggle')); ?>' />
                                    </svg>
                                </button>
                            </div>
                            <div class="swiper">
                                <div class="swiper-wrapper">
                                    <div class="swiper-slide">
                                        <img src="<?php echo esc_url(frame_asset('img/project.png')); ?>" alt="">
                                    </div>
                                    <div class="swiper-slide">
                                        <img src="<?php echo esc_url(frame_asset('img/project.png')); ?>" alt="">
                                    </div>
                                    <div class="swiper-slide">
                                        <img src="<?php echo esc_url(frame_asset('img/project.png')); ?>" alt="">
                                    </div>
                                </div>
                                <div class="swiper-pagination"></div>
                            </div>
                            <div class="projects-item__grid grid grid-2">
                                <div>
                                    <span class="text-m">Цена покупки:</span>
                                    <p class="medium-nums">$1.25 млн</p>
                                </div>
                                <div>
                                    <span class="text-m">Цена продажи:</span>
                                    <p class="medium-nums">$1.85 млн</p>
                                </div>
                                <div>
                                    <span class="text-m">Площадь объекта:</span>
                                    <p class="medium-nums">15.560 фт²</p>
                                </div>
                                <div>
                                    <span class="text-m">Срок владения:</span>
                                    <p class="medium-nums">13 месяцев</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div data-tab-content="1">
                        <div class="projects-item grid grid-3">
                            <div class="projects-item__content">
                                <div class="project-name">Aventura <br> Quattro</div>
                                <div class="projects-item__labels">
                                    <div class="loc label-m">
                                        <span>Aventura, Florida</span>
                                        <span>2022–2026</span>
                                    </div>
                                    <div class="loc label-m">
                                        <span>Ground-Up Development</span>
                                    </div>
                                </div>
                                <div class="projects-item__description" id="project-description-2">
                                    <p>Aventura Quattro — полный ground-up development: от участка и проектирования до
                                        строительства готового арендного объекта, доля DNL Capital в equity - 50%</p>
                                </div>
                                <button type="button" class="projects-item__description-toggle text-m"
                                    data-text-open="Читать описание" data-text-close="Скрыть" aria-expanded="true"
                                    aria-controls="project-description-2" hidden>
                                    <span data-description-label></span>
                                    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"
                                        aria-hidden="true">
                                        <rect x="1" y="2" width="4" height="4" rx="1" />
                                        <rect x="11" y="2" width="4" height="4" rx="1" />
                                        <rect x="6" y="7" width="4" height="4" rx="1" />
                                    </svg>
                                </button>
                            </div>
                            <div class="swiper">
                                <div class="swiper-wrapper">
                                    <div class="swiper-slide">
                                        <img src="<?php echo esc_url(frame_asset('img/project.png')); ?>" alt="">
                                    </div>
                                    <div class="swiper-slide">
                                        <img src="<?php echo esc_url(frame_asset('img/project.png')); ?>" alt="">
                                    </div>
                                    <div class="swiper-slide">
                                        <img src="<?php echo esc_url(frame_asset('img/project.png')); ?>" alt="">
                                    </div>
                                </div>
                                <div class="swiper-pagination"></div>
                            </div>
                            <div class="projects-item__grid grid grid-2">
                                <div>
                                    <span class="text-m">Общая стоимость проекта:</span>
                                    <p class="medium-nums">$7.0 млн</p>
                                </div>
                                <div>
                                    <span class="text-m">Этажа/апартаментов:</span>
                                    <p class="medium-nums">4/21</p>
                                </div>
                                <div>
                                    <span class="text-m">Площадь объекта:</span>
                                    <p class="medium-nums">15.560 фт²</p>
                                </div>
                                <div>
                                    <span class="text-m">От участка до сдачи:</span>
                                    <p class="medium-nums">2022-2026</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div data-tab-content="2">
                        <div class="projects-item grid grid-3">
                            <div class="projects-item__content">
                                <div class="project-name">1401 N <br> University Dr</div>
                                <div class="projects-item__labels">
                                    <div class="loc label-m">
                                        <span>Coral Springs, Florida</span>
                                        <span>2026-</span>
                                    </div>
                                    <div class="loc label-m">
                                        <span>Текущая инвестиция</span>
                                    </div>
                                    <div class="loc label-m">
                                        <span>Value-Add + Development</span>
                                    </div>
                                </div>
                                <div class="projects-item__description" id="project-description-3">
                                    <p>Действующий коммерческий объект с арендным доходом. Стоимость создаётся через
                                        рост
                                        заполняемости и приведение ставок к рынку, плюс свободный участок рядом с
                                        потенциалом дальнейшей застройки. DNL Capital участвует в проекте как один из
                                        инвесторов.</p>
                                </div>
                                <button type="button" class="projects-item__description-toggle text-m"
                                    data-text-open="Читать описание" data-text-close="Скрыть" aria-expanded="true"
                                    aria-controls="project-description-3" hidden>
                                    <span data-description-label></span>
                                    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"
                                        aria-hidden="true">
                                        <rect x="1" y="2" width="4" height="4" rx="1" />
                                        <rect x="11" y="2" width="4" height="4" rx="1" />
                                        <rect x="6" y="7" width="4" height="4" rx="1" />
                                    </svg>
                                </button>
                            </div>
                            <div class="swiper">
                                <div class="swiper-wrapper">
                                    <div class="swiper-slide">
                                        <img src="<?php echo esc_url(frame_asset('img/project.png')); ?>" alt="">
                                    </div>
                                    <div class="swiper-slide">
                                        <img src="<?php echo esc_url(frame_asset('img/project.png')); ?>" alt="">
                                    </div>
                                    <div class="swiper-slide">
                                        <img src="<?php echo esc_url(frame_asset('img/project.png')); ?>" alt="">
                                    </div>
                                </div>
                                <div class="swiper-pagination"></div>
                            </div>
                            <div class="projects-item__grid grid grid-2">
                                <div>
                                    <span class="text-m">Цена приобретения:</span>
                                    <p class="medium-nums">$7.0 млн</p>
                                </div>
                                <div>
                                    <span class="text-m">Участок:</span>
                                    <p class="medium-nums">2.5 акра</p>
                                </div>
                                <div>
                                    <span class="text-m">Существующий офисный объект:</span>
                                    <p class="medium-nums">49.900 фт²</p>
                                </div>
                                <div>
                                    <span class="text-m">Потенциал дополнительного residential development согласно
                                        текущей концепции:</span>
                                    <p class="medium-nums">70 units</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="projects-tabs">
                        <button class="arrow-btn arrow-btn__gray text-m _active" data-tab="0">Residential
                            Investment</button>
                        <button class="arrow-btn arrow-btn__gray text-m" data-tab="1">Aventura Quattro</button>
                        <button class="arrow-btn arrow-btn__gray text-m" data-tab="2">1401 N University Dr</button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="section seo white" id="seo">
        <div class="seo__bg">
            <div class="seo__bg-image"></div>
        </div>
        <div class="pixelated-scroll-transition" data-pixelated-scroll-transition data-color="#ffffff"
            data-direction="up" aria-hidden="true">
        </div>
        <div class="section__container _container">
            <div class="section__body">
                <div class="section__top">
                    <h2>Денис Лагутенко</h2>
                    <div class="line"><span></span></div>
                    <div class="h3 seo-subtitle">Основатель DNL Capital</div>
                </div>
                <div class="seo-text">Денис лично участвует в оценке инвестиционных возможностей и вкладывает
                    собственный капитал наряду с DNL Capital, если это допускает структура сделки.</div>

                <div class="glass__grid">
                    <div class="glass__grid-item">
                        <h4>Опыт<br>
                            в бизнесе</h4>
                        <p class="big-nums">15+ <span class="h4">лет</span></p>
                    </div>
                    <div class="glass__grid-item">
                        <h4>Начало бизнеса <br>в США</h4>
                        <p class="big-nums">2021</p>
                    </div>
                </div>

                <div class="seo-quote">
                    <svg width="32" height="30" viewBox="0 0 32 30">
                        <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#quote')); ?>' />
                    </svg>
                    <p class="h4">Собственный капитал — основа инвестиционной позиции.В DNL Capital оценка возможностей
                        всегда привязана к доступным финансовым ресурсам и допустимому уровню риска. В ключевых сделках
                        личный капитал интегрируется с капиталом компании:это гарантирует, что решения принимаются с
                        учётом реальногориска и прямой финансовой ответственности.</p>
                </div>
            </div>
        </div>
        <div class="pixelated-scroll-transition" data-pixelated-scroll-transition data-color="#000000"
            data-direction="down" aria-hidden="true">
        </div>
    </section>

    <section class="section deals white" id="deals">
        <div class="section__container _container">
            <div class="section__body">
                <div class="section__top">
                    <h2>Как мы ищем сделки</h2>
                    <div class="line"><span></span></div>
                    <p>Количество проектов неявляется целью DNL Capital.При выборе объекта мыоцениваем прежде всего
                        его экономику, существующий денежный поток, потенциал его увеличения идополнительные
                        возможности создания стоимости.</p>
                </div>
                <div class="deals-slider">
                    <div class="deals-collection__wrap">
                        <div class="deals-collection">
                            <div class="deals-media">
                                <div class="deals-media__inner">
                                    <img src="<?php echo esc_url(frame_asset('img/deals-1.png')); ?>" alt="">
                                </div>
                            </div>
                        </div>
                        <div class="deals-collection">
                            <div class="deals-media">
                                <div class="deals-media__inner">
                                    <img src="<?php echo esc_url(frame_asset('img/deals-2.png')); ?>" alt="">
                                </div>
                            </div>
                        </div>
                        <div class="deals-collection">
                            <div class="deals-media">
                                <div class="deals-media__inner">
                                    <img src="<?php echo esc_url(frame_asset('img/deals-3.png')); ?>" alt="">
                                </div>
                            </div>
                        </div>
                        <div class="deals-collection">
                            <div class="deals-media">
                                <div class="deals-media__inner">
                                    <img src="<?php echo esc_url(frame_asset('img/deals-4.png')); ?>" alt="">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="deals-controls">
                        <div class="swiper-progress"><span class="swiper-pagination-progressbar-fill"></span></div>
                        <div class="deals-viewport">
                            <div class="deals-track">
                                <div class="deals-slide active">
                                    <div class="icon" aria-hidden="true"></div>
                                    <div class="deals-slide__content">
                                        <div class="deals-slide__layer deals-slide__layer--preview" aria-hidden="true">
                                            <div class="deals-slide__head">
                                                <span class="primary-button">01</span>
                                                <h4>Existing Cash Flow</h4>
                                            </div>
                                        </div>
                                        <div class="deals-slide__layer deals-slide__layer--detail" aria-hidden="false">
                                            <div class="deals-slide__head">
                                                <span class="primary-button">01</span>
                                                <h3>Existing Cash Flow</h3>
                                            </div>
                                            <p class="primary-button">
                                                Существующий денежный поток объекта
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div class="deals-slide">
                                    <div class="icon" aria-hidden="true"></div>
                                    <div class="deals-slide__content">
                                        <div class="deals-slide__layer deals-slide__layer--preview" aria-hidden="false">
                                            <div class="deals-slide__head">
                                                <span class="primary-button">02</span>
                                                <h4>Value-Add Potential</h4>
                                            </div>
                                        </div>
                                        <div class="deals-slide__layer deals-slide__layer--detail" aria-hidden="true">
                                            <div class="deals-slide__head">
                                                <span class="primary-button">02</span>
                                                <h3>Value-Add Potential</h3>
                                            </div>
                                            <p class="primary-button">
                                                В основе инвестиции находится физический объект или земля
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div class="deals-slide">
                                    <div class="icon" aria-hidden="true"></div>
                                    <div class="deals-slide__content">
                                        <div class="deals-slide__layer deals-slide__layer--preview" aria-hidden="false">
                                            <div class="deals-slide__head">
                                                <span class="primary-button">03</span>
                                                <h4>Development Upside</h4>
                                            </div>
                                        </div>
                                        <div class="deals-slide__layer deals-slide__layer--detail" aria-hidden="true">
                                            <div class="deals-slide__head">
                                                <span class="primary-button">03</span>
                                                <h3>Development Upside</h3>
                                            </div>
                                            <p class="primary-button">
                                                Потенциал развития и повышения стоимости проекта
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div class="deals-slide">
                                    <div class="icon" aria-hidden="true"></div>
                                    <div class="deals-slide__content">
                                        <div class="deals-slide__layer deals-slide__layer--preview" aria-hidden="false">
                                            <div class="deals-slide__head">
                                                <span class="primary-button">04</span>
                                                <h4>Clear Economics</h4>
                                            </div>
                                        </div>
                                        <div class="deals-slide__layer deals-slide__layer--detail" aria-hidden="true">
                                            <div class="deals-slide__head">
                                                <span class="primary-button">04</span>
                                                <h3>Clear Economics</h3>
                                            </div>
                                            <p class="primary-button">
                                                Понятная экономика и прозрачная модель сделки
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="swiper-navigation">
                            <button class="prev" type="button" aria-label="Предыдущий этап">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#swiper-arrow')); ?>' />
                                </svg>
                            </button>
                            <button class="next" type="button" aria-label="Следующий этап">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#swiper-arrow')); ?>' />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="section why white" id="why">
        <div class="section__container _container">
            <div class="section__body">
                <div class="section__top">
                    <h2>Почему real estate</h2>
                    <div class="line"><span></span></div>
                    <p>Предприниматель, создавший капитал в основном бизнесе, сталкивается с новым вопросом: как его
                        сохранить, диверсифицировать и продолжить приумножать.</p>
                    <p>Акции, облигации, частный бизнес, стартапы, криптовалюты и недвижимость имеют разный профиль
                        риска, ликвидности и потенциальной доходности.</p>
                </div>
                <div class="why-items">
                    <div class="why-item">
                        <div class="why-item__top">
                            <span class="medium-nums">01</span>
                            <div>
                                <h3>Реальный <br>актив</h3>
                                <p>В основе инвестиции находится физический объект или земля</p>
                            </div>
                        </div>
                        <div class="img">
                            <img src="<?php echo esc_url(frame_asset('img/why-1.png')); ?>" alt="">
                        </div>
                    </div>
                    <div class="why-item">
                        <div class="why-item__top">
                            <span class="medium-nums">02</span>
                            <div>
                                <h3>Cash <br>Flow</h3>
                                <p>Недвижимость может создавать регулярный арендный поток</p>
                            </div>
                        </div>
                        <div class="img">
                            <img src="<?php echo esc_url(frame_asset('img/why-2.png')); ?>" alt="">
                        </div>
                    </div>
                    <div class="why-item">
                        <div class="why-item__top">
                            <span class="medium-nums">03</span>
                            <div>
                                <h3>Контроль над <br>созданием стоимости</h3>
                                <p>На стоимость можно влиять через occupancy, аренду, реконцепцию, улучшение объекта
                                    и development</p>
                            </div>
                        </div>
                        <div class="img">
                            <img src="<?php echo esc_url(frame_asset('img/why-3.png')); ?>" alt="">
                        </div>
                    </div>
                    <div class="why-item">
                        <div class="why-item__top">
                            <span class="medium-nums">04</span>
                            <div>
                                <h3>Несколько источников <br>результата</h3>
                                <p>арендный поток, рост NOI, изменение стоимости объекта и развитие дополнительной земли
                                    могут работать внутри одной сделки</p>
                            </div>
                        </div>
                        <div class="img">
                            <img src="<?php echo esc_url(frame_asset('img/why-4.png')); ?>" alt="">
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="pixelated-scroll-transition" data-pixelated-scroll-transition data-color="#ffffff"
            data-direction="down" aria-hidden="true">
        </div>
    </section>

    <?php get_template_part('template-parts/sections/posts'); ?>

    <section class="section white cta" id="cta">
        <div class="cta__bg">
            <div class="cta__bg-image"></div>
        </div>
        <div class="pixelated-scroll-transition" data-pixelated-scroll-transition data-color="#ffffff"
            data-direction="up" aria-hidden="true">
        </div>
        <div class="section__container _container">
            <div class="section__body">
                <div class="section__top">
                    <h2>Предложить <br>
                        инвестиционную <br>
                        возможность</h2>
                    <div class="line"><span></span></div>
                    <p>Рассматриваем инвестиционные возможности в недвижимости в США — от готовых cash-flow активов до
                        value-add и проектов с development potential.</p>
                </div>
                <button class="_btn _btn-white primary-button" data-open-popup="propose">
                    Предложить<br>проект
                </button>
            </div>
        </div>
        <div class="pixelated-scroll-transition" data-pixelated-scroll-transition data-color="#ffffff"
            data-direction="down" aria-hidden="true">
        </div>
    </section>

</main>

<?php
get_footer();
