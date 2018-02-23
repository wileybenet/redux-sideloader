const spawn = require('cross-spawn');

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}

spawn.sync('rm', ['-rf', 'lib/']);

spawn.sync(
    'babel',
    ['src', '--out-dir', 'lib', '--source-maps', '--copy-files'],
    {stdio: 'inherit'}
);
