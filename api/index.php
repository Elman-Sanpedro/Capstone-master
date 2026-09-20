<?php

/**
 * Vercel serverless entry point (vercel-php runtime). vercel.json routes every
 * request here.
 *
 * Vercel's CDN can't see files that only exist after the build (the Vite
 * bundle `composer vercel` produces), so files under public/ - build/,
 * images/, favicon - are served from here. Everything else goes to Laravel's
 * normal front controller.
 */

$publicPath = realpath(__DIR__.'/../public');
$requestPath = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));

$file = $requestPath === '' || $requestPath === '/' || str_contains($requestPath, "\0")
    ? false
    : realpath($publicPath.$requestPath);

$extension = $file === false ? '' : strtolower(pathinfo($file, PATHINFO_EXTENSION));

if (
    $file !== false
    && is_file($file)
    && str_starts_with($file, $publicPath.DIRECTORY_SEPARATOR) // no climbing out of public/
    && ! str_starts_with(basename($file), '.')                 // .htaccess and friends
    && $extension !== 'php'                                    // never hand out source
) {
    $types = [
        'css' => 'text/css; charset=utf-8',
        'js' => 'text/javascript; charset=utf-8',
        'mjs' => 'text/javascript; charset=utf-8',
        'json' => 'application/json',
        'map' => 'application/json',
        'html' => 'text/html; charset=utf-8',
        'txt' => 'text/plain; charset=utf-8',
        'xml' => 'application/xml',
        'webmanifest' => 'application/manifest+json',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'avif' => 'image/avif',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'otf' => 'font/otf',
        'pdf' => 'application/pdf',
    ];

    header('Content-Type: '.($types[$extension] ?? 'application/octet-stream'));
    header('Content-Length: '.filesize($file));
    // Vite fingerprints everything under /build/, so it can be cached for good.
    // s-maxage lets Vercel's CDN keep it too, so this function isn't woken for every asset.
    $seconds = str_starts_with($requestPath, '/build/') ? 31536000 : 86400;
    header("Cache-Control: public, max-age={$seconds}, s-maxage={$seconds}".($seconds > 86400 ? ', immutable' : ''));

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'HEAD') {
        readfile($file);
    }

    return;
}

// Serverless constraints, forced regardless of the dashboard's environment
// variables: everything under /var/task is read-only apart from /tmp, and there
// is no log file to write or queue worker to run. (A file log channel such as
// LOG_STACK=daily would otherwise turn every request into a 500.)
$tmp = rtrim(sys_get_temp_dir(), '/\\'); // /tmp on Vercel
$forced = [
    'APP_CONFIG_CACHE' => $tmp.'/config.php',
    'APP_EVENTS_CACHE' => $tmp.'/events.php',
    'APP_PACKAGES_CACHE' => $tmp.'/packages.php',
    'APP_ROUTES_CACHE' => $tmp.'/routes.php',
    'APP_SERVICES_CACHE' => $tmp.'/services.php',
    'VIEW_COMPILED_PATH' => $tmp.'/views',
    'LOG_CHANNEL' => 'stderr',
    'QUEUE_CONNECTION' => 'sync',
];

// Without an explicit APP_URL, fall back to the project's production domain.
$productionHost = getenv('VERCEL_PROJECT_PRODUCTION_URL');
if (getenv('APP_URL') === false && is_string($productionHost) && $productionHost !== '') {
    $forced['APP_URL'] = 'https://'.$productionHost;
}

foreach ($forced as $name => $value) {
    putenv("{$name}={$value}");
    $_ENV[$name] = $_SERVER[$name] = $value;
}

// Laravel works out its base URL from SCRIPT_NAME. Left as /api/index.php it
// would strip "/api" off real routes such as /api/check-username.
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = $publicPath.'/index.php';

require $publicPath.'/index.php';
