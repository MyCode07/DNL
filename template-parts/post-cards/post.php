<?php
$categories = get_the_category();
$author_id = get_the_author_meta('ID');
$publish_date = get_the_date('d M. Y');
$post_meta = $publish_date;

if ($author_id) {
    $author_name = get_the_author_meta('display_name', $author_id);
    $post_meta = get_the_author_meta('display_name', $author_id) . '<span> — ' . $publish_date . '</span>';
}

?>
<article class="post-item">
    <div class="post-item__data label-m">
        <div>
            <span class="post-item__author label-m"><?php echo $post_meta; ?></span>
        </div>
    </div>
    <h4><a href="<?php the_permalink() ?>"><?php the_title() ?></a></h4>
    <a href="<?php the_permalink() ?>" class="img">
        <?php if (! empty($categories)) : ?>
            <div class="post-item__labels">
                <?php foreach ($categories as $category) : ?>
                    <span class="label-m"><?php echo esc_html($category->name); ?></span>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        <?php if (has_post_thumbnail()):
            the_post_thumbnail();
        else: ?>
            <img src="<?php echo esc_url(frame_asset('img/post-default.png')); ?>" alt="<?php the_title() ?>">
        <?php endif; ?>
    </a>
    <p><?php echo get_loop_custom_excerpt() ?></p>
</article>