<?php
$author_id = get_the_author_meta('ID');
if (!$author_id) return;

$author = frame_get_author_data($author_id);
?>

<div class="single-data__item data-author">
    <span class="text-m"><?php echo get_localized_field('avtor') ?></span>
    <span class="text-m"><?php echo esc_html($author['name']) ?>:</span>
    <div class="single-data__author">
        <label class="primary-button"><?php echo esc_html($author['name']) ?></label>
        <span class="caption"><?php echo esc_html($author['jobTitle']) ?></span>
        <p class="text-s"><?php echo esc_html($author['description']) ?></p>
        <button class="arrow-btn"><?php echo get_localized_field('avtor_close') ?></button>
    </div>
</div>
