import React, { useState } from 'react';
import { useTranslations, Autocomplete, useGraphqlQuery } from '@openimis/fe-core';

function TicketStatusPicker(props) {
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
    `query TicketStatusPicker {
        grievanceConfig{
          ticketStatuses{code, label, initial, terminal, requiresReferralEntity}
        }
    }`,
    { searchString, first: 20 },
    { skip: true },
  );

  const statuses = data?.grievanceConfig?.ticketStatuses ?? [];
  const labelByCode = statuses.reduce((acc, status) => ({ ...acc, [status.code]: status.label }), {});

  return (
    <Autocomplete
      required={required}
      placeholder={placeholder}
      label={label ?? formatMessage('ticket.ticketStatus')}
      error={error}
      withLabel={withLabel}
      withPlaceholder={withPlaceholder}
      readOnly={readOnly}
      options={statuses.map((status) => status.code)}
      isLoading={isLoading}
      value={value}
      getOptionLabel={(option) => labelByCode[option] ?? option}
      onChange={(option) => onChange(option, option ? `${option}` : null)}
      filterOptions={filterOptions}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={setSearchString}
    />
  );
}

export default TicketStatusPicker;
