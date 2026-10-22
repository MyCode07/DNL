<?php
add_action('admin_footer', function () {

    if (
        !isset($_GET['page']) ||
        $_GET['page'] !== 'wpcf7'
    ) {
        return;
    }


    if (
        !isset($_GET['post'])
    ) {
        return;
    }


    $post_id = absint($_GET['post']);


    if (!$post_id) {
        return;
    }

    $lang = pll_get_post_language(
        $post_id,
        'name'
    );

    echo '
    <script>
    jQuery(function($){

        console.log("CF7 ADMIN FOUND", ' . $post_id . ');

        $("#submitdiv").after(`
            <div class="postbox">
                <h2 class="hndle">
                    <span>Язык формы</span>
                    ' . esc_js($lang) . '
                </h2>
                <div class="inside">
                    ID формы: ' . $post_id . '
                </div>
            </div>
        `);

    });
    </script>';
});
