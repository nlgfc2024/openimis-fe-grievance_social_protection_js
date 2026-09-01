import React, { useState } from 'react';
import {
  Autocomplete, useGraphqlQuery, useTranslations, decodeId,
} from '@openimis/fe-core';
import { PROJECT_HOUSEHOLDS_QUERY } from '../actions';
import { REPORTER_PICKER_PAGE_SIZE } from '../constants';

// Lists the households (group beneficiaries) enrolled in the selected project.
// Value is the GroupBeneficiary node; the caller drills into `.group` to pick
// the reporting member. Backed by project_social_protection's
// projectEligibleGroupBeneficiaries query (enrolledInProject filter).
function ProjectHouseholdPicker(props) {
  const {
    project,
    value,
    onChange,
    readOnly,
    required,
    label,
    withLabel = true,
  } = props;

  const { formatMessage } = useTranslations('grievanceSocialProtection');
  const [searchString, setSearchString] = useState('');

  const projectId = project ? decodeId(project.id) : null;

  const { isLoading, data, error } = useGraphqlQuery(
    PROJECT_HOUSEHOLDS_QUERY,
    { projectId, first: REPORTER_PICKER_PAGE_SIZE },
    { skip: !projectId },
  );

  const households = data?.projectEligibleGroupBeneficiaries?.edges?.map((edge) => edge.node) ?? [];

  const optionLabel = (option) => {
    const head = option?.group?.head;
    const headName = head ? [head.firstName, head.lastName].filter(Boolean).join(' ') : '';
    const code = option?.group?.code;
    return [headName, code && `(${code})`].filter(Boolean).join(' ');
  };

  return (
    <Autocomplete
      required={required}
      withLabel={withLabel}
      label={label || formatMessage('ticket.household.label')}
      placeholder={formatMessage('ticket.household.placeholder')}
      error={error}
      readOnly={readOnly || !projectId}
      options={households}
      isLoading={isLoading}
      value={value}
      getOptionLabel={optionLabel}
      getOptionSelected={(option, v) => option?.id === v?.id}
      onChange={(v) => onChange(v, v ? optionLabel(v) : null)}
      onInputChange={setSearchString}
      filterOptions={(options) => {
        const q = (searchString || '').toLowerCase().trim();
        if (!q) return options;
        return options.filter((o) => optionLabel(o).toLowerCase().includes(q));
      }}
    />
  );
}

export default ProjectHouseholdPicker;
