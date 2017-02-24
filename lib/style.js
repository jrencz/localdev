const {
  bgGreen,
  bgRed,
  bgYellow,
  bold,
  cyan,
  italic,
  magenta,
  underline,
} = require('colors');

const upper = str => str.toUpperCase();

const val = name => bold(name);
const dir = name => cyan(name);
const tool = name => bold(cyan(name));
const id = name => italic(magenta(name));
const act = name => bold(underline(name));
const state = name => bold(upper(name));
const cmd = name => magenta(bold(name));

const success = name => bgGreen(state(name));
const failure = name => bgRed(state(name));
const alert = name => bgYellow(state(name));

module.exports = {
  classes: {
    val,
    dir,
    tool,
    id,
    act,
    state,
    cmd
  },
  states: {
    success,
    failure,
    alert
  },
};
