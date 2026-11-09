<?php
get_header();
?>

<main>

    <?php
    get_template_part('template-parts/sections/hero');

    get_template_part('template-parts/sections/criteria');

    get_template_part('template-parts/sections/projects');

    get_template_part('template-parts/sections/ceo');

    get_template_part('template-parts/sections/deals');

    get_template_part('template-parts/sections/why');

    get_template_part('template-parts/sections/posts');

    get_template_part('template-parts/sections/cta');
    ?>

</main>

<?php
get_footer();
