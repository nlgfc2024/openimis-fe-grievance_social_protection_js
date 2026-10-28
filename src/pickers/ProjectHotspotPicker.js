import React, { useEffect, useState } from 'react';
import { TextField } from '@material-ui/core';
import { Autocomplete, decodeId, useGraphqlQuery } from '@openimis/fe-core';

function ProjectHotspotPicker({
  microCatchment, required = false, readOnly = false, value, onChange,
}) {
  const [search, setSearch] = useState('');

  useEffect(() => setSearch(''), [microCatchment?.uuid]);

  const { data, error, isLoading } = useGraphqlQuery(
    `
      query GrievanceHotspots($search: String, $microCatchment: String) {
        hotspots(
          first: 20,
          name_Icontains: $search,
          microCatchment_Uuid: $microCatchment,
          orderBy: "name"
        ) {
          edges { node { id uuid code name } }
        }
      }
    `,
    { search, microCatchment: microCatchment?.uuid },
    { skip: !microCatchment?.uuid },
  );

  const options = data?.hotspots?.edges?.map(({ node }) => ({
    ...node,
    gqlId: node.id,
    id: decodeId(node.id),
  })) ?? [];

  return (
    <Autocomplete
      required={required}
      readOnly={readOnly || !microCatchment}
      error={error}
      isLoading={isLoading}
      options={options}
      value={value}
      getOptionLabel={(option) => [option?.code, option?.name].filter(Boolean).join(' - ')}
      getOptionSelected={(option, selected) => option?.id === selected?.id}
      onChange={onChange}
      onInputChange={setSearch}
      renderInput={(inputProps) => (
        <TextField
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...inputProps}
          required={required}
          label="Hotspot"
        />
      )}
    />
  );
}

export default ProjectHotspotPicker;
