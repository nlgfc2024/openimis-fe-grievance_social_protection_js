import React from 'react';
import { Grid } from '@material-ui/core';
import { PublishedComponent } from '@openimis/fe-core';

export const LOCATION_LEVELS = {
  district: {
    picker: 'location.MwDistrictPicker',
  },
  ta: {
    picker: 'location.MwTAPicker',
    parent: 'district',
    parentProps: (parent) => ({ parentLocation: parent }),
  },
  micro_catchment: {
    picker: 'location.MicroCatchmentPicker',
    parent: 'district',
    parentProps: (parent) => ({ district: parent }),
  },
  hotspot: {
    picker: 'projectSocialProtection.HotspotPicker',
    parent: 'micro_catchment',
    parentProps: (parent) => ({ microCatchmentUuid: parent?.uuid }),
  },
};

function GrievanceLocationFilters({
  classes,
  levels,
  selectedLocations,
  onChange,
  readOnly,
}) {
  return levels.filter(({ key }) => LOCATION_LEVELS[key]).map((level) => {
    const definition = LOCATION_LEVELS[level.key];
    const parent = definition.parent
      ? selectedLocations[definition.parent]
      : null;
    const parentProps = definition.parentProps
      ? definition.parentProps(parent)
      : {};

    return (
      <Grid item xs={3} className={classes.item} key={level.key}>
        <PublishedComponent
          pubRef={definition.picker}
          withNull
          withLabel
          required={!!level.required}
          value={selectedLocations[level.key]}
          onChange={(value) => onChange(level.key, value)}
          readOnly={readOnly || (!!definition.parent && !parent)}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...parentProps}
        />
      </Grid>
    );
  });
}

export default GrievanceLocationFilters;
