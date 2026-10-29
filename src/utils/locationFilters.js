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
  const deepestSelectedLevel = [...levels]
    .reverse()
    .find(({ key }) => selectedLocations[key]);
  const selected = deepestSelectedLevel
    ? selectedLocations[deepestSelectedLevel.key]
    : null;

  return {
    parentLocation: ['district', 'ta'].includes(deepestSelectedLevel?.key)
      ? selected
      : null,
    microCatchment: deepestSelectedLevel?.key === 'micro_catchment'
      ? selected
      : null,
    hotspot: deepestSelectedLevel?.key === 'hotspot' ? selected : null,
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
