<?php
$publish_date = get_the_date('d M. Y');
$modified_date = get_the_modified_date('d M. Y');
?>

<div class="single-data__double single-data__date">
    <div class="single-data__item">
        <span class="text-m"><?php echo get_localized_field('data_publikaczii') ?>:</span>
        <span class="text-m"><?php echo esc_html($publish_date); ?></span>
    </div>
    <?php
    //выводить всегда — уберите условие if
    if (get_the_modified_time('U') > get_the_time('U')) :
    ?>
        <div class="single-data__item">
            <span class="text-m"><?php echo get_localized_field('obnovleno') ?>:</span>
            <span class="text-m"><?php echo esc_html($modified_date); ?></span>
        </div>
    <?php endif; ?>
</div>