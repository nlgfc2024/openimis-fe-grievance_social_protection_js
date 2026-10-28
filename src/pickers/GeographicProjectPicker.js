import React, { useEffect, useState } from 'react';
import { TextField } from '@material-ui/core';
import {
  Autocomplete, decodeId, useGraphqlQuery, useTranslations,
} from '@openimis/fe-core';

function GeographicProjectPicker({
  benefitPlanId,
  parentLocation,
  microCatchment,
  hotspot,
  multiple = false,
  required = false,
  label,
  readOnly = false,
  value,
  onChange,
}) {
  const { formatMessage } = useTranslations('projectSocialProtection');
  const [filters, setFilters] = useState({
    benefitPlan_Id: benefitPlanId,
    parentLocation: parentLocation?.uuid,
    microCatchment_Id: microCatchment?.id,
    hotspot_Id: hotspot?.gqlId,
    isDeleted: false,
  });

  useEffect(() => {
    setFilters((previous) => ({
      ...previous,
      benefitPlan_Id: benefitPlanId,
      parentLocation: parentLocation?.uuid,
      microCatchment_Id: microCatchment?.id,
      hotspot_Id: hotspot?.gqlId,
    }));
  }, [benefitPlanId, parentLocation?.uuid, microCatchment?.id, hotspot?.gqlId]);

  const { isLoading, data, error } = useGraphqlQuery(
    `
      query GrievanceProjectPicker(
        $search: String,
        $first: Int,
        $benefitPlan_Id: ID,
        $parentLocation: String,
        $microCatchment_Id: ID,
        $hotspot_Id: ID,
        $isDeleted: Boolean
      ) {
        project(
          name_Icontains: $search,
          first: $first,
          benefitPlan_Id: $benefitPlan_Id,
          parentLocation: $parentLocation,
          microCatchment_Id: $microCatchment_Id,
          hotspot_Id: $hotspot_Id,
          isDeleted: $isDeleted,
          orderBy: "name"
        ) {
          edges {
            node {
              id
              name
              status
            }
          }
        }
      }
    `,
    filters,
    { skip: !benefitPlanId },
  );

  const projects = data?.project?.edges?.map(({ node }) => ({
    ...node,
    id: decodeId(node.id),
  })) ?? [];

  return (
    <Autocomplete
      multiple={multiple}
      required={required}
      error={error}
      readOnly={readOnly || !benefitPlanId}
      options={projects}
      isLoading={isLoading}
      value={value}
      getOptionLabel={(option) => option?.name ?? ''}
      getOptionSelected={(option, selected) => option?.id === selected?.id}
      onChange={onChange}
      onInputChange={(search) => setFilters((previous) => ({ ...previous, search }))}
      renderInput={(inputProps) => (
        <TextField
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...inputProps}
          required={required}
          label={label || formatMessage('project.picker.label')}
        />
      )}
    />
  );
}

export default GeographicProjectPicker;
