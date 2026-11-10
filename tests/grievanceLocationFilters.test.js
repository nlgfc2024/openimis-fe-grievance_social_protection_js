const assert = require('assert');
const path = require('path');
const { transformFileSync } = require('@babel/core');

const source = path.resolve(
  __dirname,
  '../src/components/GrievanceLocationFilters.js',
);
const { code } = transformFileSync(source, {
  babelrc: false,
  configFile: false,
  presets: [
    ['@babel/preset-env', { modules: 'commonjs' }],
    '@babel/preset-react',
  ],
});

const createElement = (type, props, ...children) => ({ type, props, children });
const react = {
  __esModule: true,
  default: { createElement },
};
const Grid = Symbol('Grid');
const PublishedComponent = Symbol('PublishedComponent');
const localRequire = (moduleName) => {
  if (moduleName === 'react') return react;
  if (moduleName === '@material-ui/core') return { Grid };
  if (moduleName === '@openimis/fe-core') return { PublishedComponent };
  throw new Error(`Unexpected module: ${moduleName}`);
};

const moduleUnderTest = { exports: {} };
// eslint-disable-next-line no-new-func
Function('exports', 'module', 'require', code)(
  moduleUnderTest.exports,
  moduleUnderTest,
  localRequire,
);
const GrievanceLocationFilters = moduleUnderTest.exports.default;

const district = { uuid: 'district-uuid' };
const microCatchment = { uuid: 'micro-catchment-uuid' };
const rendered = GrievanceLocationFilters({
  classes: { item: 'item' },
  levels: [
    { key: 'district', required: true },
    { key: 'micro_catchment', required: true },
    { key: 'hotspot', required: true },
  ],
  selectedLocations: {
    district,
    micro_catchment: microCatchment,
    hotspot: null,
  },
  benefitPlanId: 'benefit-plan-id',
  onChange: () => {},
  readOnly: false,
});

const pickerProps = rendered.map((gridElement) => gridElement.children[0].props);
const microCatchmentProps = pickerProps.find(
  ({ pubRef }) => pubRef === 'location.MicroCatchmentPicker',
);
const hotspotProps = pickerProps.find(
  ({ pubRef }) => pubRef === 'projectSocialProtection.HotspotPicker',
);

assert.strictEqual(microCatchmentProps.benefitPlanId, 'benefit-plan-id');
assert.strictEqual(microCatchmentProps.district, district);
assert.strictEqual(hotspotProps.benefitPlanId, undefined);
assert.strictEqual(hotspotProps.microCatchmentUuid, microCatchment.uuid);

console.log('GrievanceLocationFilters tests passed');
