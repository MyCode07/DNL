<?php
$criteria = get_field('kriterii');
$list = $criteria['spisok'];
?>
<section class="section criteria pb0" id="criteria" data-dark>
    <div class="section__container _container">
        <div class="section__body">
            <div class="section__top">
                <h2><?php echo $criteria['zagolovok'] ?></h2>
                <div class="line"><span></span></div>
                <p><?php echo $criteria['podzagolovok'] ?></p>
            </div>
            <div class="_label label-uppercase-m"><?php echo $criteria['plashka'] ?></div>
            <?php if ($list): ?>
                <div class="criteria-items">
                    <?php foreach ($list as $key => $item): ?>
                        <div class="criteria-item">
                            <span class="medium-nums">0<?php echo $key + 1 ?></span>
                            <h3><?php echo $item['zagolovok'] ?></h3>
                            <div class="img">
                                <img src="<?php echo esc_url($item['foto']['url']); ?>" alt="<?php echo $item['foto']['alt'] ?>">
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>