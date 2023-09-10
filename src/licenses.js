import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * @returns {string}
 */
export function getLicenses() {
  /** @type {{packages: object}} */
  const packageJson = JSON.parse(
    readFileSync(
      fileURLToPath(
        new URL('../node_modules/.package-lock.json', import.meta.url)
      )
    ).toString()
  );
  const styles = readFileSync(
    fileURLToPath(
      new URL('../public/layout/licenses.css', import.meta.url)
    )
  ).toString();
  return '<title>Licenses</title>' +
    '<style>' + styles + '</style>' +
    '<h1>Licenses</h1>' +
    Object.entries(packageJson.packages)
      .filter(entry => entry[1].dev !== true)
      .flatMap(
        entry => readdirSync(
          fileURLToPath(
            new URL('../' + entry[0] + '/', import.meta.url)
          )
        ).filter(file => file.toLowerCase().includes('license'))
          .map(
            file => ({
              license: readFileSync(
                fileURLToPath(
                  new URL('../' + entry[0] + '/' + file, import.meta.url)
                )
              ).toString(),
              name: entry[0].slice(entry[0].lastIndexOf('/') + 1)
            })
          )
      )
      .filter(
        (element, index, array) => array.findIndex(
          duplicate => duplicate.name === element.name
        ) - index === 0
      )
      .sort((first, second) => first.name.localeCompare(second.name))
      .map(
        entry => '<h2>' + entry.name + '</h2><p>' + entry.license
          .replaceAll('  ', ' ')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('\n\n', '</p><p>')
          .replaceAll('\n', ' ') + '</p>'
      )
      .join('');
}
