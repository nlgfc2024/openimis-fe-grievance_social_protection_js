import React, { useState } from 'react';
import {
  Autocomplete, useGraphqlQuery, useTranslations, decodeId,
} from '@openimis/fe-core';
import { HOUSEHOLD_MEMBERS_QUERY } from '../actions';
import { REPORTER_PICKER_PAGE_SIZE } from '../constants';

// Lists the individuals belonging to a household (group). Value is the
// Individual node — used as the grievance reporter (reporterType 'individual',
// since the model can't hold a GroupBeneficiary).
function HouseholdMemberPicker({
  group,
  value,
  onChange,
  readOnly,
  required,
  label,
  withLabel = true,
}) {
  const { formatMessage } = useTranslations('grievanceSocialProtection');
  const [searchString, setSearchString] = useState('');

  const groupId = group ? decodeId(group.id) : null;

  const { isLoading, data, error } = useGraphqlQuery(
    HOUSEHOLD_MEMBERS_QUERY,
    { groupId, first: REPORTER_PICKER_PAGE_SIZE },
    { skip: !groupId },
  );

  const members = data?.individual?.edges?.map((edge) => edge.node) ?? [];

  const optionLabel = (option) => (option
    ? [option.firstName, option.lastName, option.dob].filter(Boolean).join(' ')
    : '');

  return (
    <Autocomplete
      required={required}
      withLabel={withLabel}
      label={label || formatMessage('ticket.householdMember.label')}
      placeholder={formatMessage('ticket.householdMember.placeholder')}
      error={error}
      readOnly={readOnly || !groupId}
      options={members}
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

export default HouseholdMemberPicker;
