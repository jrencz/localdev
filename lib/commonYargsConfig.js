const env = require('./configenv');

module.exports = yargs => yargs
  .usage('Usage: $0 [--config|-c]')
  .example('$0 --config="localdev.config.json"')
  .help('h')
  .alias('h', 'help')
  .config('c')
  .alias('c', 'config')
  .describe('c', 'Path to file with plugin configuration. JSON/JSON5 accepted.')
  .default('c', process.env[env])
  .requiresArg([
    'c',
  ])
  .version(function() {
    return require('../package.json').version;
  })
  .alias('v', 'version')
  .check(function (argv) {
    if (!argv.config) {
      throw `Config is missing. Use [--config|-c] or set ${ env }`;
    }
    return true;
  })
;
