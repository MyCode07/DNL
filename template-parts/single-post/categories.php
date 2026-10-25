<?php
$categories = get_the_category();

if (empty($categories))  return;

$count = count($categories);
$cats_label = ($count === 1) ? get_localized_field('rubrika') . ':' : get_localized_field('rubriki') . ':';
$category_names = wp_list_pluck($categories, 'name');
$categories_string = implode(', ', $category_names);
?>

<div class="single-data__item">
    <span class="text-m"><?php echo $cats_label ?></span>
    <span class="text-m">
        <?php echo esc_html($categories_string) ?>
    </span>
</div>