<?php
$expert = get_field('ekspert');
if (!$expert) return;
?>
<div class="single-data__item">
    <span class="text-m"><?php echo get_localized_field('ekspert') ?>:</span>
    <span class="text-m"><?php echo $expert ?></span>
</div>