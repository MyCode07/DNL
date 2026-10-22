<?php

class Cookies
{

    // $time = 60*60*24*30;

    static function set($name, $value, $time = 60 * 60 * 24 * 30)
    {
        setcookie($name, $value, time() + $time, '/');
    }

    static function delete($name)
    {
        setcookie($name, "", time() - 3600, "/");
    }

    static function update($name, $value)
    {
        return self::set($name, $value);
    }

    static function get($name)
    {
        if (isset($_COOKIE[$name])) {
            return $_COOKIE[$name];
        } else {
            return null;
        }
    }
}

add_action('wp_ajax_cookie_action', 'cookie_action');
add_action('wp_ajax_nopriv_cookie_action', 'cookie_action');
function cookie_action()
{

    Cookies::set('cookie', true);
    $clicked = true;

    echo json_encode([
        'Cookies' => Cookies::get('cookie')
    ]);

    exit();
}
