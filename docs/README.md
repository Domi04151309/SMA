# Generating The Object Map

```javascript
const ORIGINAL_OBJECT_MAP = ...;
const OBJECT_MAP = Object.fromEntries(
  Object.entries(ORIGINAL_OBJECT_MAP)
    .map(([key, value]) => [value.obj + '_' + value.lri, key])
    .sort(([first], [second]) => first.localeCompare(second))
);
console.log(
  'export const OBJECT_MAP = ' +
  JSON.stringify(OBJECT_MAP, null, 2).replaceAll('"', '\'')
);
```

# Greenhouse Gas Emission Intensity Of Electricity Generation

- [European Environment Agency](https://www.eea.europa.eu/data-and-maps/daviz/co2-emission-intensity-13)
