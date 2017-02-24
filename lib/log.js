const {
  classes: {
    tool,
  },
} = require('./style');

const {name} = require('../package.json');

module.exports = (...msgs) => {
  console.log(tool(`[${ name }]`), ...msgs);
};
