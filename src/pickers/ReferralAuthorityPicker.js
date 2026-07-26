import React, { useState } from 'react';
import { useTranslations, Autocomplete, useGraphqlQuery } from '@openimis/fe-core';

function ReferralAuthorityPicker(props) {
  const {
    onChange,
    readOnly,
    required,
    withLabel = true,
    withPlaceholder,
    value,
    label,
    filterOptions,
    filterSelectedOptions,
    placeholder,
  } = props;
  const [searchString, setSearchString] = useState(null);
  const { formatMessage } = useTranslations('ticket');

  const { isLoading, data, error } = useGraphqlQuery(
    `query ReferralAuthorityPicker {
        grievanceConfig{
          referralEntities
        }
    }`,
    { searchString, first: 20 },
    { skip: true },
  );

  return (
    <Autocomplete
      required={required}
      placeholder={placeholder ?? formatMessage('ReferralAuthorityPicker.placeholder')}
      label={label ?? formatMessage('ReferralAuthorityPicker.label')}
      error={error}
      withLabel={withLabel}
      withPlaceholder={withPlaceholder}
      readOnly={readOnly}
      options={data?.grievanceConfig?.referralEntities ?? []}
      isLoading={isLoading}
      value={value}
      getOptionLabel={(option) => `${option}`}
      onChange={(option) => onChange(option, option ? `${option}` : null)}
      filterOptions={filterOptions}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={setSearchString}
    />
  );
}

export default ReferralAuthorityPicker;
