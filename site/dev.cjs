// Start `next dev` from this folder whatever the caller's working directory.
process.chdir(__dirname);
process.argv = [process.argv[0], require.resolve('next/dist/bin/next'), 'dev', '-p', process.env.PORT || '3300'];
require('next/dist/bin/next');
