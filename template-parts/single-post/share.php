<?php
$current_url   = urlencode(get_permalink());
$current_title = urlencode(get_the_title());

// Ссылки для соцсетей
$share_links = [
    'telegram'  => 'https://t.me/share/url?url=' . $current_url . '&text=' . $current_title,
    'facebook'  => 'https://www.facebook.com/sharer/sharer.php?u=' . $current_url,
    'linkedin'  => 'https://www.linkedin.com/sharing/share-offsite/?url=' . $current_url,
    // Для Instagram прямой ссылки-шеринга нет (он не поддерживает веб-публикацию по ссылке),
    // поэтому обычно туда ставят ссылку на профиль сайта или оставляют как есть / скрывают
    'instagram' => 'https://instagram.com/#',
];
?>

<div class="single-data__share <?php echo $args['class'] ?>">
    <span class="text-m"><?php echo get_localized_field('podelitsya') ?></span>
    <div class="_social">

        <button type="button" class="js-share-copy-open" data-url="<?php echo esc_url($raw_url); ?>" data-app="instagram://app" data-web="https://www.instagram.com/" aria-label="Instagram">
            <svg width="20" height="20" viewBox="0 0 20 20">
                <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#instagram')); ?>' />
            </svg>
        </button>

        <a href="<?php echo esc_url($share_links['facebook']); ?>" target="_blank" rel="nofollow" aria-label="Facebook">
            <svg width="20" height="20" viewBox="0 0 20 20">
                <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#facebook')); ?>' />
            </svg>
        </a>
        <a href="<?php echo esc_url($share_links['linkedin']); ?>" target="_blank" rel="nofollow" aria-label="LinkedIn">
            <svg width="20" height="20" viewBox="0 0 20 20">
                <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#linkedin')); ?>' />
            </svg>
        </a>
        <a href="<?php echo esc_url($share_links['telegram']); ?>" target="_blank" rel="nofollow" aria-label="Telegram">
            <svg width="20" height="20" viewBox="0 0 20 20">
                <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#telegram')); ?>' />
            </svg>
        </a>
        <button class="copy-url" type="button" data-url="<?php echo esc_url(get_permalink()); ?>">
            <svg width="20" height="20" viewBox="0 0 20 20">
                <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#copy')); ?>' />
            </svg>
        </button>
    </div>
</div>