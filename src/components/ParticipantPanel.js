import React from 'react';
import _ from 'lodash';
import { withStyles } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';
import { TextInput } from '@openimis/fe-core';
import { MODULE_NAME, EMPTY_STRING } from '../constants';

const styles = (theme) => ({
  item: theme.paper.item,
});

// Synthetic source, resolved specially below rather than via a jsonExt path,
// since a participant's display name is composed from several reporter fields.
const FULL_NAME_SOURCE = 'reporter.fullName';

function parseJsonExt(jsonExt) {
  if (!jsonExt) return {};
  if (typeof jsonExt === 'object') return jsonExt;
  try {
    return JSON.parse(jsonExt) || {};
  } catch (e) {
    return {};
  }
}

// Individual and beneficiary reporters are shaped differently (a beneficiary
// wraps its individual under `.individual`) — normalise to a common shape so
// participant_fields sources don't need to know which one they're dealing with.
function normalizeReporter(reporter) {
  if (!reporter) return null;
  const individualLike = reporter.individual ?? reporter;
  return { ...individualLike, jsonExt: parseJsonExt(individualLike.jsonExt) };
}

function resolveFullName(reporter) {
  if (!reporter) return EMPTY_STRING;
  return [reporter.firstName, reporter.lastName, reporter.dob].filter(Boolean).join(' ');
}

function resolveFieldValue(field, context) {
  if (field.source === FULL_NAME_SOURCE) {
    return resolveFullName(context.reporter);
  }
  const resolved = _.get(context, field.source);
  return resolved === undefined || resolved === null ? EMPTY_STRING : `${resolved}`;
}

/**
 * Renders the deployment-configured participant_fields (grievanceConfig) as
 * read-only fields, resolved against the selected reporter's own jsonExt
 * (available even before the ticket is saved) and — once a ticket exists —
 * its own denormalised json_ext (district/project/catchment/days_worked,
 * populated server-side on create).
 */
function ParticipantPanel({
  classes, participantFields, reporter, ticketJsonExt,
}) {
  if (!participantFields || !participantFields.length) return null;

  const context = {
    reporter: normalizeReporter(reporter),
    ticket: { jsonExt: parseJsonExt(ticketJsonExt) },
  };

  return (
    <>
      {participantFields.map((field) => (
        <Grid item xs={4} className={classes.item} key={field.key}>
          <TextInput
            module={MODULE_NAME}
            label={field.label}
            value={resolveFieldValue(field, context)}
            onChange={() => {}}
            required={false}
            readOnly
          />
        </Grid>
      ))}
    </>
  );
}

export default withStyles(styles)(ParticipantPanel);
