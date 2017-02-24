/**
 * @param {object} object
 * @param {function(value: *, key: string, object: object): *}iteratee
 */
const mapValues = (object, iteratee) => Object
  .keys(object)
  .reduce((accumulator, key) => Object.assign(accumulator, {
    [key]: iteratee(object[key], key, object),
  }), object);

const pickBy = (object, predicate) => Object
  .keys(object)
  .filter(predicate)
  .reduce((accumulator, key) => Object.assign(accumulator, {
    [key]: object[key],
  }), {});

const isObject = object => typeof object === 'object' &&
  object !== null;

module.exports = {
  mapValues,
  pickBy,
  isObject
};
