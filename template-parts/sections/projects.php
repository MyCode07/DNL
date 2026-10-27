<?php
$projects = get_field('proekty');
$selected_projects = new WP_Query([
    'post_type' => 'project',
    'posts__in' => $projects['spisok'] ?? [],
    'posts_per_page' => $projects['spisok'] ? count($projects['spisok']) : 3,
    'orderby' => 'posts__in',
    'order' => 'ASC',
]);
if (!$selected_projects->have_posts()) return;
$tabs = '<div class="projects-tabs">';
?>
<section class="section projects" id="projects" data-tab-area="10000" data-dark>
    <div class="section__container _container">
        <div class="section__body">
            <div class="section__top">
                <h2><?php echo $projects['zagolovok'] ?></h2>
                <div class="line"><span></span></div>
            </div>
            <div class="projects-wrap">
                <?php
                $count = 0;
                $_active = '_active';
                while ($selected_projects->have_posts()) {
                    $selected_projects->the_post();
                    $tabs .= '<button class="arrow-btn arrow-btn__gray text-m ' . $_active . '" data-tab="' . $count . '">' . get_the_title() . '</button>';
                    echo '<div data-tab-content="' . $count . '" class="' . $_active . '">';
                    get_template_part('template-parts/post-cards/project-inside-tab');
                    echo '</div>';
                    $count++;
                    $_active = '';
                }
                wp_reset_postdata();
                $tabs .= '</div>';
                ?>
                <?php echo $tabs ?>
            </div>
        </div>
    </div>
</section>