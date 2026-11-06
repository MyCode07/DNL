<?php
if (!$args['btn']) return;
$btn = $args['btn'];

if ($btn['ssylka'] && $btn['ssylka']['url']):
    echo get_link_info($btn['ssylka'], '_btn _btn-white primary-button');
else: ?>
    <button class="_btn _btn-white primary-button" data-open-popup="popup-<?php echo $btn['popap'] ?>">
        <?php echo $btn['tekst'] ?>
    </button>
<?php endif; ?>