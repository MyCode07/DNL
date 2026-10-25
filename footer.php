<?php
if (!is_404()) {
    require_once 'footer-block.php';
}
get_template_part('template-parts/popups/#include');
wp_footer();
?>
<div class="copied-text arrow-btn text-m"><?php echo get_localized_field('skopirovano') ?? "Copied"; ?></div>
</body>

</html>