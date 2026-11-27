<?php
$socials = get_global_field('soczseti');
$social_labels = ['instagram' => 'Instagram', 'linkedin' => 'LinkedIn'];
foreach ((array) $socials as $key => $item):
    if ($item): ?>
        <a href="<?php echo esc_url($item) ?>" target="_blank" rel="nofollow noopener noreferrer" aria-label="<?php echo esc_attr($social_labels[$key] ?? $key) ?>">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <use xlink:href="<?php echo esc_url(frame_asset('img/svg/icons.svg#' . $key . '')); ?>" />
            </svg>
        </a>
<?php endif;
endforeach; ?>
