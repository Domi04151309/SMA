import { plot } from 'asciichart';
import { table } from 'table';

/**
 * @param {unknown} json
 * @param {number} limit
 * @returns {string}
 */
export function toColoredString(json, limit = 10) {
  return JSON.stringify(
    json,
    (_, /** @type {unknown} */ value) => {
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
      case 'object':
        if (value === null) colored = '\u001B[1mnull';
        else if (
          Array.isArray(value) && value.length > limit
        ) colored = '\u001B[36m[Array]';
        else if (
          Object.keys(value).length > limit
        ) colored = '\u001B[36m[Object]';
        else return value;
        break;
      default:
        return value;
      }
      return colored + '\u001B[39m\u001B[0m';
    },
    2
  ).replaceAll('"', '')
    .replaceAll(/\\u001b\[32m/gui, '\u001B[32m')
    .replaceAll(/\\u001b\[33m/gui, '\u001B[33m')
    .replaceAll(/\\u001b\[36m/gui, '\u001B[36m')
    .replaceAll(/\\u001b\[37m/gui, '\u001B[37m')
    .replaceAll(/\\u001b\[1m/gui, '\u001B[1m')
    .replaceAll(/\\u001b\[0m/gui, '\u001B[0m')
    .replaceAll(/\\u001b\[39m/gui, '\u001B[39m');
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
