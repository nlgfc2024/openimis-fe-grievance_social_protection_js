import React from 'react';
import { useGraphqlQuery, decodeId } from '@openimis/fe-core';
import ParticipantPanel from './ParticipantPanel';
import { REPORTER_DERIVED_FIELDS_QUERY } from '../actions';

// ParticipantPanel for the intake form: the reporter's own jsonExt (village,
// GVH, TA, NID, phone) resolves client-side, but district / micro-catchment /
// project / hotspot are derived server-side at ticket create. This asks the
// backend to compute them for the selected reporter so they show before save.
// Both the "existing individual" and the household-member flows store an
// Individual, so the preview is always queried as reporterType 'individual'.
function ReporterDerivedPanel({ participantFields, reporter }) {
  const reporterId = reporter?.id ? decodeId(reporter.id) : null;

  const { data } = useGraphqlQuery(
    REPORTER_DERIVED_FIELDS_QUERY,
    { reporterType: 'individual', reporterId },
    { skip: !reporterId },
  );

  return (
    <ParticipantPanel
      participantFields={participantFields}
      reporter={reporter}
      ticketJsonExt={data?.grievanceReporterDerivedFields}
    />
  );
}

export default ReporterDerivedPanel;
