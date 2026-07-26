import React from 'react';
import {
  PublishedComponent, useGraphqlQuery, decodeId,
} from '@openimis/fe-core';
import { parseJsonExt } from '../utils/utils';

/**
 * Wraps admin.UserPicker, restricting candidates to the ticket's category's
 * configured assignment roles (grievanceConfig.grievanceCategoryStaffRoles)
 * and, when that category's scope is 'district', to users assigned to the
 * ticket's own derived district (via the users query's native `roles`/
 * `district_id` filter args — no custom picker/query needed beyond that).
 * Categories with no assignment config fall back to an unrestricted picker.
 *
 * Note: district-scope filtering only takes effect once the ticket has been
 * saved — district_code is denormalised onto ticket.json_ext server-side at
 * create time, so on the Add page (no ticketJsonExt yet) it has no effect.
 */
function AttendingStaffPicker(props) {
  const {
    category, ticketJsonExt, value, onChange, readOnly, required, label, ...rest
  } = props;

  const { data: configData } = useGraphqlQuery(
    `query AttendingStaffPickerConfig {
        grievanceConfig{
          grievanceCategoryStaffRoles{category, roleIds, strategy, scope}
        }
    }`,
    {},
  );

  const roleConfig = (configData?.grievanceConfig?.grievanceCategoryStaffRoles ?? [])
    .find((entry) => entry.category === category);
  const roleIds = roleConfig?.roleIds ?? [];
  const scope = roleConfig?.scope;
  const districtCode = parseJsonExt(ticketJsonExt).district_code;
  const shouldLookupDistrict = scope === 'district' && !!districtCode;

  const { data: locationData } = useGraphqlQuery(
    `query AttendingStaffPickerDistrict($code: String) {
        locations(code: $code) {
          edges { node { id } }
        }
    }`,
    { code: districtCode },
    { skip: !shouldLookupDistrict },
  );

  const filters = [];
  if (roleIds.length) {
    filters.push(`roles: [${roleIds.join(',')}]`);
  }
  if (shouldLookupDistrict) {
    const districtNode = locationData?.locations?.edges?.[0]?.node;
    if (districtNode) {
      filters.push(`district_id: ${decodeId(districtNode.id)}`);
    }
  }

  return (
    <PublishedComponent
      pubRef="admin.UserPicker"
      module="core"
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      required={required}
      label={label}
      filters={filters}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    />
  );
}

export default AttendingStaffPicker;
