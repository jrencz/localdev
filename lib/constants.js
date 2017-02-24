const {
  classes: {
    act,
    state,
  },
  states: {
    success,
    failure,
  },
} = require('./style');

const LINKING = act('linking');
const UNLINKING = act('unlinking');
const INSTALLING = act('installing');

const LINKED = state('linked');
const INSTALLED = state('installed');

const DONE = success(' done ');
const FAILED = failure(' failed ');
const ERROR = failure(' error ');
const EXIT = success(' exit ');

module.exports = {
  actions: {
    LINKING,
    UNLINKING,
    INSTALLING,
  },
  states: {
    LINKED,
    INSTALLED
  },
  outcomes: {
    FAILED,
    DONE,
    ERROR,
    EXIT,
  }
};
