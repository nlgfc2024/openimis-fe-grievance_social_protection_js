import React from 'react';
import { Chip } from '@material-ui/core';
import {
  useModulesManager,
  useGraphqlQuery,
  useTranslations,
  useHistory,
  historyPush,
  decodeId,
  parseData,
} from '@openimis/fe-core';
import { MODULE_NAME, PARTIAL_WAGES_TASK_BUSINESS_EVENT, TASKS_MANAGEMENT_TASK_ROUTE_REF } from '../constants';
import { isBase64Encoded } from '../utils/utils';

const STATUS_COLORS = {
  COMPLETED: 'primary',
  FAILED: 'secondary',
};

// ticketId can arrive already-decoded (EditTicketPage) or as a base64 relay id.
const toRawId = (id) => {
  if (!id) return null;
  return isBase64Encoded(id) ? decodeId(id) : id;
};

function PartialWagesTaskStatus({ ticketId }) {
  const modulesManager = useModulesManager();
  const history = useHistory();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

  const entityId = toRawId(ticketId);

  const { data } = useGraphqlQuery(
    `
    query PartialWagesTaskStatus($entityId: String, $businessEvent: String) {
      task(entityId: $entityId, businessEvent: $businessEvent) {
        edges {
          node {
            id
            status
          }
        }
      }
    }
    `,
    { entityId, businessEvent: PARTIAL_WAGES_TASK_BUSINESS_EVENT },
    { skip: !entityId },
  );

  const task = parseData(data?.task)?.[0];
  if (!task) return null;

  const taskRoute = modulesManager.getRef(TASKS_MANAGEMENT_TASK_ROUTE_REF);
  const canNavigate = !!taskRoute;
  const label = `${formatMessage('ticket.partialWagesTask.label')}: `
    + `${formatMessage(`ticket.partialWagesTask.status.${task.status}`)}`;

  return (
    <Chip
      label={label}
      color={STATUS_COLORS[task.status]}
      clickable={canNavigate}
      onClick={canNavigate
        ? () => historyPush(modulesManager, history, TASKS_MANAGEMENT_TASK_ROUTE_REF, [decodeId(task.id)])
        : undefined}
    />
  );
}

export default PartialWagesTaskStatus;
