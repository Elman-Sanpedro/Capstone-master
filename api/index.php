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

// There is no .env here: every setting comes from the project's environment
// variables. Missing ones surface as a blank 500 (the logs are a tab away and
// APP_DEBUG is off), so name them instead. Names only — never values.
$isSet = fn (string $name) => ! in_array(getenv($name), [false, ''], true);

$missing = [];
if (! $isSet('APP_KEY')) {
    $missing[] = 'APP_KEY';
}
if (! $isSet('DB_CONNECTION')) {
    $missing[] = 'DB_CONNECTION';
}

// The database is given either as one DB_URL connection string or as the
// separate parts; only complain about the parts when there is no DB_URL.
if (! $isSet('DB_URL')) {
    foreach (['DB_HOST', 'DB_DATABASE', 'DB_USERNAME'] as $name) {
        if (! $isSet($name)) {
            $missing[] = $name;
        }
    }

    // An empty password is legal elsewhere, so only a completely unset one counts.
    if (getenv('DB_PASSWORD') === false) {
        $missing[] = 'DB_PASSWORD';
    }
}

if ($missing) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo "This deployment is not configured yet.\n\n",
        "Missing environment variables: ", implode(', ', $missing), "\n\n",
        "Add them under Settings > Environment Variables (Production), then redeploy.\n",
        "DB_CONNECTION is the driver name (pgsql), not a connection string; the\n",
        "database parts can be given individually or as one DB_URL instead.\n",
        "See .env.production.example and DEPLOYMENT.md in the repository.\n";

    return;
}

// Laravel works out its base URL from SCRIPT_NAME. Left as /api/index.php it
// would strip "/api" off real routes such as /api/check-username.
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = $publicPath.'/index.php';

require $publicPath.'/index.php';
