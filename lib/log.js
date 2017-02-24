const {cyan} = require('colors');
const {name} = require('../package.json');

const prefix = cyan(`[${ name }:link]`);

return (...msgs) => {
  console.log(prefix, ...msgs);
};
