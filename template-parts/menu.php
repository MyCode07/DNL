<?php
$is_glass_menu = is_front_page();

$is_english = function_exists('pll_current_language') && pll_current_language('slug') === 'en';
$menu_open = get_localized_field('menyu_otkryt') ?: ($is_english ? 'Open menu' : 'Открыть меню');
$menu_close = get_localized_field('menyu_zakryt') ?: ($is_english ? 'Close menu' : 'Закрыть меню');
$menu_btn = get_localized_field('knopka_menyu');
$menu_social = get_localized_field('menyu_soczseti');
$global_btn = get_localized_field('globalnaya_knopka');
?>
<div class="menu">
    <div class="menu-surface">
        <div class="menu-heading">
            <a href="<?php echo get_home_page_url() ?>" class="menu-logo">
                <img src="<?php echo esc_url(frame_asset('img/logo-mb.svg')); ?>" width="50" height="20" alt="<?php echo bloginfo('name') ?>">
            </a>
            <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu-body" aria-labelledby="menu-toggle-label">
                <span id="menu-toggle-label" class="label-m" data-text-open="<?php echo esc_attr($menu_open) ?>" data-text-close="<?php echo esc_attr($menu_close) ?>"><?php echo htmlspecialchars($menu_open, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
            <?php echo get_locate_menu('primary'); ?>

            <?php if ($menu_btn['ssylka'] && $menu_btn['ssylka']['url']):
                echo get_link_info($menu_btn['ssylka'], 'menu-btn text-m');
            else: ?>
                <button class="menu-btn text-m" data-open-popup="popup-<?php echo $menu_btn['popap'] ?>">
                    <?php echo $menu_btn['tekst'] ?>
                    <svg width="13" height="10" viewBox="0 0 13 10">
                        <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#menu-btn-arrow')); ?>' />
                    </svg>
                </button>
            <?php endif; ?>

            <div class="lang menu-line">
                <?php pll_the_languages(); ?>
            </div>
            <div class="menu-soc">
                <span class="label-m" style="display: none;"><?php echo $menu_social ?></span>
                <div class="_social _social-border">
                    <?php get_template_part('template-parts/social-links') ?>
                </div>
            </div>
        </div>
    </div>
    <div class="menu-project" <?php echo $is_glass_menu ? '' : 'style="height:0px"' ?> inert>
        <?php
        $btn_class = '_btn-' . (($is_glass_menu || is_404()) ? 'white' : 'black');

        if ($global_btn['ssylka'] && $global_btn['ssylka']['url']):
            echo get_link_info($global_btn['ssylka'], '_btn ' . $btn_class . ' primary-button');
        else: ?>
            <button class="_btn <?php echo esc_attr($btn_class); ?> primary-button" data-open-popup="popup-<?php echo $global_btn['popap'] ?>">
                <?php echo $global_btn['tekst'] ?>
            </button>
        <?php endif; ?>
    </div>
</div>
