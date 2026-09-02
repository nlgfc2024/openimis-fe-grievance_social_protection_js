import React from 'react';
import { useGraphqlQuery } from '@openimis/fe-core';
import ParticipantPanel from './ParticipantPanel';
import { REPORTER_DERIVED_FIELDS_QUERY } from '../actions';
import { toRawId } from '../utils/utils';

// ParticipantPanel for the intake form: the reporter's own jsonExt (village,
// GVH, TA, NID, phone) resolves client-side, but district / micro-catchment /
// project / hotspot are derived server-side at ticket create. This asks the
// backend to compute them for the selected reporter — pinned to the selected
// project/household so the values match the intake selection rather than an
// unrelated first enrolment. Both the "existing individual" and household-member
// flows store an Individual, so the preview is always reporterType 'individual'.
function ReporterDerivedPanel({
  participantFields, reporter, project, household,
}) {
  const reporterId = toRawId(reporter?.id);
  const projectId = toRawId(project?.id);
  const groupBeneficiaryId = toRawId(household?.id);

  const { data } = useGraphqlQuery(
    REPORTER_DERIVED_FIELDS_QUERY,
    {
      reporterType: 'individual', reporterId, projectId, groupBeneficiaryId,
    },
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
