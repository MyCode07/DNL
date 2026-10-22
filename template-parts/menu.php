<?php
$is_glass_menu = is_front_page();
?>
<div class="menu">
    <div class="menu-surface">
        <div class="menu-heading">
            <a href="/" class="menu-logo" aria-label="DNL Capital" inert>
                <img src="<?php echo esc_url(frame_asset('img/logo-mb.svg')); ?>" width="50" height="20" alt="DNL Capital">
            </a>
            <button class="menu-toggle" aria-expanded="false" aria-controls="menu-body">
                <span class="label-m" data-text-open="Меню" data-text-close="Закрыть">Меню</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="2" width="4" height="4" rx="1" fill="white" fill-opacity="0.2" />
                    <rect x="10" y="2" width="4" height="4" rx="1" fill="white" />
                    <rect x="18" y="2" width="4" height="4" rx="1" fill="white" fill-opacity="0.2" />
                    <rect x="2" y="10" width="4" height="4" rx="1" fill="white" />
                    <rect x="10" y="10" width="4" height="4" rx="1" fill="white" />
                    <rect x="18" y="10" width="4" height="4" rx="1" fill="white" />
                    <rect x="2" y="18" width="4" height="4" rx="1" fill="white" fill-opacity="0.2" />
                    <rect x="10" y="18" width="4" height="4" rx="1" fill="white" />
                    <rect x="18" y="18" width="4" height="4" rx="1" fill="white" fill-opacity="0.2" />
                </svg>
            </button>
        </div>
        <div class="menu-body" id="menu-body" inert>
            <nav>
                <ul>
                    <li><a href="/#criteria">О DNL capital</a></li>
                    <li><a href="/#projects">Проекты</a></li>
                    <li><a href="/#seo">Основатель</a></li>
                    <li><a href="/#deals">Подход</a></li>
                    <li><a href="/publications/">Публикации</a></li>
                </ul>
            </nav>
            <button class="menu-btn text-m">
                Оставить контакт
                <svg width="13" height="10" viewBox="0 0 13 10">
                    <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#menu-btn-arrow')); ?>' />
                </svg>
            </button>
            <div class="lang menu-line">
                <li class="lang-item current-lang"><a href="">RU</a></li>
                <li class="lang-item"><a href="">EN</a></li>
            </div>
            <div class="menu-soc ">
                <span class="label-m">Соцсети</span>
                <div class="menu-line _social _social-border">
                    <a href="" target="_blank" rel="nofollow">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#insta')); ?>' />
                        </svg>
                    </a>
                    <a href="" target="_blank" rel="nofollow">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#linkedin')); ?>' />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    </div>
    <div class="menu-project" <?php echo $is_glass_menu ? '' : 'style="height:0px"' ?> inert>
        <button class="_btn _btn-<?php echo ($is_glass_menu || is_404()) ? 'white' : 'black' ?> primary-button" data-open-popup="propose">
            Предложить<br>проект
        </button>
    </div>
</div>
