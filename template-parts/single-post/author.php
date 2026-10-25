<?php
$author_id = get_the_author_meta('ID');
if (!$author_id) return;

$author_name = get_the_author_meta('display_name', $author_id);
$author_position = get_field('dolzhnost', 'user_' . $author_id);
$author_description = get_field('opisanie', 'user_' . $author_id);
?>

<div class="single-data__item data-author">
    <span class="text-m"><?php echo get_localized_field('avtor') ?></span>
    <span class="text-m"><?php echo $author_name ?>:</span>
    <div class="single-data__author">
        <label class="primary-button"><?php echo $author_name ?></label>
        <span class="caption"><?php echo $author_position ?></span>
        <p class="text-s"><?php echo $author_description ?></p>
        <button class="arrow-btn"><?php echo get_localized_field('avtor_close') ?></button>
    </div>
</div>