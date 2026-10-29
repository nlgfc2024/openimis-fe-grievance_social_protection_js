const assert = require('assert');
const path = require('path');
const { transformFileSync } = require('@babel/core');

const source = path.resolve(__dirname, '../src/utils/locationFilters.js');
const { code } = transformFileSync(source, {
  presets: [['@babel/preset-env', { modules: 'commonjs' }]],
});
const moduleUnderTest = { exports: {} };
Function('exports', 'module', 'require', code)(
  moduleUnderTest.exports,
  moduleUnderTest,
  require,
);

const {
  areRequiredLocationsSelected,
  clearDownstreamLocations,
  getProjectLocationFilters,
  parseLocationFilters,
} = moduleUnderTest.exports;

const pwpLevels = [
  { key: 'district', required: true },
  { key: 'micro_catchment', required: true },
  { key: 'hotspot', required: true },
];
const jobsNowLevels = [
  { key: 'district', required: true },
  { key: 'ta', required: true },
];

assert.deepStrictEqual(
  parseLocationFilters(JSON.stringify({ enabled: true, levels: pwpLevels })),
  { enabled: true, levels: pwpLevels },
);
assert.deepStrictEqual(parseLocationFilters({ enabled: false, levels: pwpLevels }), {
  enabled: false,
  levels: pwpLevels,
});

const originalConsoleError = console.error;
let parseErrorLogged = false;
console.error = () => { parseErrorLogged = true; };
assert.deepStrictEqual(parseLocationFilters('{invalid'), { enabled: false, levels: [] });
console.error = originalConsoleError;
assert.strictEqual(parseErrorLogged, true);

const district = { uuid: 'district' };
const ta = { uuid: 'ta' };
const microCatchment = { id: 3, uuid: 'micro-catchment' };
const hotspot = { id: 4, gqlId: 'Hotspot:4' };

assert.strictEqual(
  areRequiredLocationsSelected(pwpLevels, { district, micro_catchment: null, hotspot: null }),
  false,
);
assert.strictEqual(
  areRequiredLocationsSelected(pwpLevels, { district, micro_catchment: microCatchment, hotspot }),
  true,
);
assert.strictEqual(
  areRequiredLocationsSelected(jobsNowLevels, { district, ta }),
  true,
);

assert.deepStrictEqual(
  clearDownstreamLocations(
    pwpLevels,
    { district, micro_catchment: microCatchment, hotspot },
    'district',
    { uuid: 'new-district' },
  ),
  { district: { uuid: 'new-district' }, micro_catchment: null, hotspot: null },
);

assert.deepStrictEqual(
  getProjectLocationFilters(pwpLevels, { district, micro_catchment: microCatchment, hotspot }),
  { parentLocation: null, microCatchment: null, hotspot },
);
assert.deepStrictEqual(
  getProjectLocationFilters(pwpLevels, { district, micro_catchment: microCatchment, hotspot: null }),
  { parentLocation: null, microCatchment, hotspot: null },
);
assert.deepStrictEqual(
  getProjectLocationFilters(jobsNowLevels, { district, ta }),
  { parentLocation: ta, microCatchment: null, hotspot: null },
);

console.log('locationFilters tests passed');
