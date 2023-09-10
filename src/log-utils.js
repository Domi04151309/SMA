import { plot } from 'asciichart';
import { table } from 'table';

/**
 * @param {unknown} value
 * @returns {string}
 */
function toColoredString(value) {
  let colored = '';
  switch (typeof value) {
  case 'boolean':
  case 'number':
    colored = '\u001B[33m' + value.toString();
    break;
  case 'string':
    colored = '\u001B[32m\'' + value + '\'';
    break;
  case 'undefined':
    colored = '\u001B[37mundefined';
    break;
  default:
    if (value === null) colored = '\u001B[1m';
    colored += JSON.stringify(value);
    break;
  }
  return colored + '\u001B[39m';
}

/**
 * @param {unknown} json
 * @param {number} limit
 * @returns {unknown}
 */
export function trimLargeObjectIfObject(json, limit = 50) {
  return typeof json === 'object' &&
    !Array.isArray(json) &&
    json !== null &&
    Object.keys(json).length > limit
    ? '{\n  ' + Object.entries(json)
      .slice(0, limit)
      .map(
        ([key, value]) => toColoredString(key) + ': ' + toColoredString(value)
      )
      .join(',\n  ') + ',\n  ... ' + (Object.keys(json).length - limit) +
      ' more items\n}'
    : json;
}

/**
 * @param {string} title
 * @param {number[]} data
 * @returns {void}
 */
export function logChart(title, data) {
  // eslint-disable-next-line no-console
  console.log(
    title + '\n' + plot(data, { colors: ['\u001B[33m'], height: 15 })
  );
}

/**
 * @param {unknown[][]} data
 * @returns {void}
 */
export function logTable(data) {
  // eslint-disable-next-line no-console
  console.log(
    table(
      data.map(row => row.map(column => toColoredString(column))),
      {
        border: {
          bodyJoin: '│',
          bodyLeft: '│',
          bodyRight: '│',
          bottomBody: '─',
          bottomJoin: '┴',
          bottomLeft: '└',
          bottomRight: '┘',
          joinBody: '─',
          joinJoin: '┼',
          joinLeft: '├',
          joinRight: '┤',
          topBody: '─',
          topJoin: '┬',
          topLeft: '┌',
          topRight: '┐'
        },
        singleLine: true
      }
    )
  );
}
