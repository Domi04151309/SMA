# Generating The Object Map

```javascript
for (
  // eslint-disable-next-line no-underscore-dangle, no-undef
  const value of angular.module('app.services')._invokeQueue
) if (
  value[2][0] === 'KeySvc'
) {
  const string = value[2][1][3].toString();
  const slicedStart = string.slice(string.indexOf('}},r=') + 5);
  const sliced = slicedStart.slice(0, slicedStart.indexOf('}}') + 2);
  // eslint-disable-next-line no-eval
  eval('const keys = ' + sliced + '; console.log(keys);');
  // eslint-disable-next-line no-console
  console.log(sliced);
  break;
}
```

```javascript
const ORIGINAL_OBJECT_MAP = ...;
const OBJECT_MAP = Object.fromEntries(
  Object.entries(ORIGINAL_OBJECT_MAP)
    .map(([key, value]) => [value.obj + '_' + value.lri, key])
    .sort(([first], [second]) => first.localeCompare(second))
);
// eslint-disable-next-line no-console
console.log(
  'export const OBJECT_MAP = ' +
  JSON.stringify(OBJECT_MAP, null, 2).replaceAll('"', '\'')
);
```

# Greenhouse Gas Emission Intensity Of Electricity Generation

- [European Environment Agency](https://www.eea.europa.eu/data-and-maps/daviz/co2-emission-intensity-13)
