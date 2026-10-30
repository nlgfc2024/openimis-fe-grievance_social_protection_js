export const EMPTY_SELECTED_LOCATIONS = {
  district: null,
  ta: null,
  micro_catchment: null,
  hotspot: null,
};

const DISABLED_LOCATION_FILTERS = { enabled: false, levels: [] };

export const parseLocationFilters = (value) => {
  if (!value) return DISABLED_LOCATION_FILTERS;

  try {
    const parsed = typeof value === 'object' ? value : JSON.parse(value);
    return {
      enabled: parsed.enabled === true,
      levels: Array.isArray(parsed.levels) ? parsed.levels : [],
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unable to parse grievance location filters', error);
    return DISABLED_LOCATION_FILTERS;
  }
};

export const getProjectLocationFilters = (levels, selectedLocations) => {
  const configuredKeys = new Set(levels.map(({ key }) => key));
  const deepestSelectedKey = ['hotspot', 'micro_catchment', 'ta', 'district']
    .find((key) => configuredKeys.has(key) && selectedLocations[key]);
  const selected = deepestSelectedKey
    ? selectedLocations[deepestSelectedKey]
    : null;

  return {
    parentLocation: ['district', 'ta'].includes(deepestSelectedKey)
      ? selected
      : null,
    microCatchment: deepestSelectedKey === 'micro_catchment'
      ? selected
      : null,
    hotspot: deepestSelectedKey === 'hotspot' ? selected : null,
  };
};

export const clearDownstreamLocations = (
  levels,
  selectedLocations,
  changedKey,
  value,
) => {
  const changedIndex = levels.findIndex(({ key }) => key === changedKey);
  return levels.slice(changedIndex + 1).reduce(
    (locations, { key }) => ({ ...locations, [key]: null }),
    { ...selectedLocations, [changedKey]: value },
  );
};

export const areRequiredLocationsSelected = (levels, selectedLocations) => (
  levels.every(({ key, required }) => !required || selectedLocations[key])
);
