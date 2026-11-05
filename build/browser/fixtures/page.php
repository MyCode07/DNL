<?php
// Render the actual component templates with deterministic WordPress/ACF data.
// CF7 transport is supplied by the browser tests; no messages are sent.
error_reporting(E_ALL);
set_error_handler(static function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});
$root = dirname(__DIR__, 3);
function esc_attr($value)
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
function esc_url($value)
{
    return esc_attr($value);
}
function frame_asset($path)
{
    return '/dist/' . $path;
}
function wp_unique_id($prefix = '')
{
    static $id = 0;
    return $prefix . ++$id;
}
function is_front_page()
{
    return true;
}
function is_404()
{
    return false;
}
function bloginfo($name)
{
    echo 'Frame';
}
function get_home_page_url()
{
    return '/';
}
function get_localized_field($name)
{
    return match ($name) {
        'menyu_otkryt' => 'Open menu',
        'menyu_zakryt' => 'Close menu',
        'knopka_menyu', 'globalnaya_knopka' => ['ssylka' => null, 'popap' => 1, 'tekst' => 'Contact'],
        'uspeshnaya_otpravka' => [
            'zagolovok' => 'Thank you',
            'tekst' => 'Your message has been sent.',
            'knopka' => 'Home',
        ],
        'oshibka_otpravki' => [
            'zagolovok' => 'Error',
            'tekst' => 'Please try again.',
            'knopka' => 'Retry',
        ],
        default => '',
    };
}
function get_locate_menu($location)
{
    return '<nav><a href="#projects">Projects</a></nav>';
}
function pll_the_languages() {}
function get_template_part($path)
{
    if ($path === 'template-parts/social-links') return;
    require $GLOBALS['root'] . '/' . $path . '.php';
}
function get_field($name)
{
    if ($name === 'galereya') return [['id' => 1], ['id' => 2], ['id' => 3]];
    if ($name === 'sdelki') return [
        'zagolovok' => 'Deals',
        'podzagolovok' => 'Deal stages',
        'spisok' => array_fill(0, 4, [
            'zagolovok' => 'Deal stage',
            'tekst' => 'Stage description',
            'foto' => ['id' => 1],
            'foto_mobajl' => ['url' => '/dist/img/project.png'],
        ]),
    ];
    if ($name === 'pochemu') return [
        'zagolovok' => 'Why Frame',
        'podzagolovok' => 'Our advantages',
        'podzagolovok_2' => '',
        'spisok' => array_fill(0, 5, [
            'zagolovok' => 'Advantage',
            'tekst' => 'Description',
            'foto' => ['id' => 1],
        ]),
    ];
    return false;
}
function wp_get_attachment_image($id, $size)
{
    return '<img src="/dist/img/project.png" alt="Project image" width="600" height="400">';
}
function the_title()
{
    echo 'Project ' . $GLOBALS['project'];
}
function the_field($name)
{
    echo 'Description of project ' . $GLOBALS['project'];
}
?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/dist/css/style.min.css">
    <style>
        [data-tab-content]:not(._active) {
            display: none;
        }

        main {
            padding: 180px 20px 40px;
        }
    </style>
</head>

<body>
    <header class="header _fixed">
        <a class="header__logo" href="/">Frame</a>
        <?php require $root . '/template-parts/menu.php'; ?>
    </header>
    <main>
        <section class="projects" id="projects" data-tab-area>
            <?php for ($project = 1; $project <= 3; $project++): ?>
                <button data-tab="<?php echo $project; ?>" class="<?php echo $project === 1 ? '_active' : ''; ?>">Project <?php echo $project; ?></button>
                <div data-tab-content="<?php echo $project; ?>" class="<?php echo $project === 1 ? '_active' : ''; ?>">
                    <?php require $root . '/template-parts/post-cards/project-inside-tab.php'; ?>
                </div>
            <?php endfor; ?>
        </section>
        <?php require $root . '/template-parts/sections/why.php'; ?>
        <?php require $root . '/template-parts/sections/deals.php'; ?>
        <div class="wpcf7" id="inline-form">
            <form novalidate data-status="init">
                <div class="form__item"><input aria-label="Name" name="cname" required></div>
                <button type="submit">Send</button>
            </form>
        </div>
    </main>
    <div class="popup _fixed" id="popup-1">
        <div class="popup-body">
            <?php require $root . '/template-parts/popups/result.php'; ?>
            <button class="popup-close" type="button">Close</button>
            <div class="form">
                <div class="wpcf7">
                    <form novalidate data-status="init">
                        <div class="form__item"><input aria-label="Name" name="cname" required></div>
                        <button type="submit">Send</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <?php require $root . '/template-parts/popups/form-result.php'; ?>
    <script src="/components.js"></script>
</body>

</html>
