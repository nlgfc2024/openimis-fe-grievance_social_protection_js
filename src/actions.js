/* eslint-disable no-nested-ternary */
/* eslint-disable max-len */
import {
  graphql, formatMutation, formatPageQueryWithCount, formatGQLString, decodeId, formatQuery,
} from '@openimis/fe-core';
import { ACTION_TYPE } from './reducer';
import { FETCH_INDIVIDUAL_REF } from './constants';
import { isBase64Encoded } from './utils/utils';
import {
  CLEAR, ERROR, REQUEST, SUCCESS,
} from './utils/action-type';

const GRIEVANCE_CONFIGURATION_PROJECTION = () => [
  'grievanceTypes',
  'grievanceFlags',
  'grievanceChannels',
  'grievanceDefaultResolutionsByCategory{category, resolutionTime}',
  'grievanceCategoryStaffRoles{category, roleIds, strategy, scope}',
  'grievanceCategoryWorkflows{category, makerChecker, requiresAmount, onApprovedSignal, onResolveTask}',
  'ticketStatuses{code, label, initial, terminal, requiresReferralEntity}',
  'referralEntities',
  'participantFields{key, label, source}',
  'searchFilters',
  'searchResultColumns{key, label}',
  'sla',
  'enableExport',
];

const CATEGORY_FULL_PROJECTION = () => [
  'id',
  'uuid',
  'categoryTitle',
  'slug',
  'validityFrom',
  'validityTo',
];

export const PROJECT_HOUSEHOLDS_QUERY = `
  query GrievanceProjectHouseholds($projectId: String, $first: Int) {
    projectEligibleGroupBeneficiaries(
      enrolledInProject: $projectId, isDeleted: false, first: $first
    ) {
      edges {
        node {
          id
          jsonExt
          group { id code head { firstName lastName dob } }
        }
      }
    }
  }
`;

export const HOUSEHOLD_MEMBERS_QUERY = `
  query GrievanceHouseholdMembers($groupId: String, $first: Int) {
    individual(groupId: $groupId, isDeleted: false, first: $first) {
      edges {
        node {
          id
          firstName
          lastName
          dob
          jsonExt
        }
      }
    }
  }
`;

export function fetchCategoryForPicker(mm, filters) {
  const payload = formatPageQueryWithCount('category', filters, CATEGORY_FULL_PROJECTION(mm));
  return graphql(payload, 'CATEGORY_CATEGORY');
}

export function fetchTicketSummaries(mm, filters) {
  const projections = [
    'id', 'title', 'code', 'description', 'status',
    'priority', 'dueDate', 'reporter', 'reporterId',
    'reporterType', 'reporterTypeName', 'category', 'flags',
    'channel', 'resolution', 'title', 'dateOfIncident', 'dateCreated', 'version', 'isHistory',
    'reporterFirstName', 'reporterLastName', 'reporterDob',
    'jsonExt', 'durationDays', 'slaState', 'wageAmount', 'attendingStaff{id, username}',
  ];
  const payload = formatPageQueryWithCount(
    'tickets',
    filters,
    projections,
  );
  return graphql(payload, 'TICKET_TICKETS');
}

export function fetchTicket(mm, filters) {
  const projections = [
    'id', 'title', 'code', 'description', 'status',
    'priority', 'dueDate', 'reporter', 'reporterId',
    'reporterType', 'reporterTypeName', 'category', 'flags', 'channel',
    'resolution', 'title', 'dateOfIncident', 'dateCreated',
    'attendingStaff {id, username}', 'version', 'isHistory,', 'jsonExt',
    'reporterFirstName', 'reporterLastName', 'reporterDob', 'wageAmount',
  ];
  const payload = formatPageQueryWithCount(
    'tickets',
    filters,
    projections,
  );
  return graphql(payload, 'TICKET_TICKET');
}

export function fetchComments(ticket) {
  if (ticket && ticket.id) {
    const filters = [
      `ticket_Id: "${ticket.id}"`,
      'orderBy: ["-dateCreated"]',
    ];
    const projections = [
      'id',
      'commenter',
      'commenterId',
      'commenterType',
      'commenterTypeName',
      'comment',
      'isResolution',
      'dateCreated',
      'commenterFirstName',
      'commenterLastName',
      'commenterDob',
    ];
    const payload = formatPageQueryWithCount(
      'comments',
      filters,
      projections,
    );
    return graphql(payload, 'COMMENT_COMMENTS');
  }
  return { type: 'COMMENT_COMMENTS', payload: { data: [] } };
}

// Hand-captured walk-in complainant. The backend stores these on
// ticket.json_ext['unregistered_reporter'] and ignores them when reporterId is
// set. See the grievance module README for why walk-ins aren't auto-registered.
function formatUnregisteredReporterGQL(ticket) {
  if (ticket.reporter) return '';
  return [
    ticket.reporterFirstName ? `reporterFirstName: "${formatGQLString(ticket.reporterFirstName)}"` : '',
    ticket.reporterLastName ? `reporterLastName: "${formatGQLString(ticket.reporterLastName)}"` : '',
    ticket.reporterDob ? `reporterDob: "${formatGQLString(ticket.reporterDob)}"` : '',
    ticket.reporterPhone ? `reporterPhone: "${formatGQLString(ticket.reporterPhone)}"` : '',
    ticket.reporterNationalId ? `reporterNationalId: "${formatGQLString(ticket.reporterNationalId)}"` : '',
  ].filter(Boolean).join('\n    ');
}

export function formatTicketGQL(ticket) {
  return `
    ${ticket.id !== undefined && ticket.id !== null ? `id: "${ticket.id}"` : ''}
    ${ticket.code ? `code: "${formatGQLString(ticket.code)}"` : ''}
    ${!!ticket.category && !!ticket.category ? `category: "${ticket.category}"` : ''}
    ${!!ticket.title && !!ticket.title ? `title: "${ticket.title}"` : ''}
    ${!!ticket.attendingStaff && !!ticket.attendingStaff ? `attendingStaffId: "${decodeId(ticket.attendingStaff.id)}"` : ''}
    ${!!ticket.description && !!ticket.description ? `description: "${ticket.description}"` : ''}
    ${ticket.reporter
    ? (isBase64Encoded(ticket.reporter.id)
      ? `reporterId: "${decodeId(ticket.reporter.id)}"`
      : `reporterId: "${ticket.reporter.id}"`)
    : ''}
    ${!!ticket.reporterType && !!ticket.reporterType ? `reporterType: "${ticket.reporterType}"` : ''}
    ${formatUnregisteredReporterGQL(ticket)}
    ${ticket.resolution ? `resolution: "${formatGQLString(ticket.resolution)}"` : ''}
    ${ticket.status ? `status: "${formatGQLString(ticket.status)}"` : ''}
    ${ticket.priority ? `priority: "${formatGQLString(ticket.priority)}"` : ''}
    ${ticket.dueDate ? `dueDate: "${formatGQLString(ticket.dueDate)}"` : ''}
    ${ticket.dateSubmitted ? `dateSubmitted: "${formatGQLString(ticket.dateSubmitted)}"` : ''}
    ${ticket.dateOfIncident ? `dateOfIncident: "${formatGQLString(ticket.dateOfIncident)}"` : ''}
    ${!!ticket.channel && !!ticket.channel ? `channel: "${ticket.channel}"` : ''}
    ${!!ticket.flags && !!ticket.flags ? `flags: "${ticket.flags}"` : ''}
  `;
}

export function formatUpdateTicketGQL(ticket) {
  // eslint-disable-next-line no-param-reassign
  if (ticket.reporter) ticket.reporter = JSON.parse(JSON.parse(ticket.reporter || '{}'), '{}');
  return `
    ${ticket.id !== undefined && ticket.id !== null ? `id: "${ticket.id}"` : ''}
    ${!!ticket.category && !!ticket.category ? `category: "${ticket.category}"` : ''}
    ${!!ticket.title && !!ticket.title ? `title: "${ticket.title}"` : ''}
    ${!!ticket.description && !!ticket.description ? `description: "${ticket.description}"` : ''}
    ${!!ticket.attendingStaff && !!ticket.attendingStaff ? `attendingStaffId: "${decodeId(ticket.attendingStaff.id)}"` : ''}
    ${ticket.reporter
    ? (isBase64Encoded(ticket.reporter.id)
      ? `reporterId: "${decodeId(ticket.reporter.id)}"`
      : `reporterId: "${ticket.reporter.id}"`)
    : ''}
    ${!!ticket.reporter && !!ticket.reporter ? `reporterType: "${ticket.reporterTypeName}"` : ''}
    ${formatUnregisteredReporterGQL(ticket)}
    ${ticket.resolution ? `resolution: "${formatGQLString(ticket.resolution)}"` : ''}
    ${ticket.status ? `status: ${formatGQLString(ticket.status)}` : ''}
    ${ticket.referredTo ? `referredTo: "${formatGQLString(ticket.referredTo)}"` : ''}
    ${ticket.wageAmount !== undefined && ticket.wageAmount !== null && ticket.wageAmount !== '' ? `wageAmount: ${ticket.wageAmount}` : ''}
    ${ticket.priority ? `priority: "${formatGQLString(ticket.priority)}"` : ''}
    ${ticket.dueDate ? `dueDate: "${formatGQLString(ticket.dueDate)}"` : ''}
    ${ticket.dateSubmitted ? `dateSubmitted: "${formatGQLString(ticket.dateSubmitted)}"` : ''}
    ${ticket.dateOfIncident ? `dateOfIncident: "${formatGQLString(ticket.dateOfIncident)}"` : ''}
    ${!!ticket.channel && !!ticket.channel ? `channel: "${ticket.channel}"` : ''}
    ${!!ticket.flags && !!ticket.flags ? `flags: "${ticket.flags}"` : ''}
  `;
}

export function createTicket(ticket, grievanceConfig, clientMutationLabel) {
  const resolutionTimeMap = {};
  grievanceConfig.grievanceDefaultResolutionsByCategory.forEach((item) => {
    resolutionTimeMap[item.category] = item.resolutionTime;
  });
  // eslint-disable-next-line no-param-reassign
  ticket.resolution = resolutionTimeMap[ticket.category];
  const mutation = formatMutation('createTicket', formatTicketGQL(ticket), clientMutationLabel);
  const requestedDateTime = new Date();
  return graphql(mutation.payload, ['TICKET_MUTATION_REQ', 'TICKET_CREATE_TICKET_RESP', 'TICKET_MUTATION_ERR'], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,

  });
}

export function updateTicket(ticket, clientMutationLabel) {
  const mutation = formatMutation('updateTicket', formatUpdateTicketGQL(ticket), clientMutationLabel);
  const requestedDateTime = new Date();
  return graphql(mutation.payload, ['TICKET_MUTATION_REQ', 'TICKET_UPDATE_TICKET_RESP', 'TICKET_MUTATION_ERR'], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
    id: ticket.id,
  });
}

export function formatTicketCommentGQL(ticketComment, ticket, commenterType) {
  return `
    ${ticketComment.uuid !== undefined && ticketComment.uuid !== null ? `uuid: "${ticketComment.uuid}"` : ''}
    ${ticket.id ? `ticketId: "${ticket.id}"` : ''}
    ${ticketComment.commenter ? `commenterId: "${decodeId(ticketComment.commenter.id)}"` : ''}
    ${commenterType ? `commenterType: "${commenterType}"` : ''}
    ${ticketComment.comment ? `comment: "${formatGQLString(ticketComment.comment)}"` : ''}
  `;
}

export function createTicketComment(ticketComment, ticket, commenterType, clientMutationLabel) {
  const mutation = formatMutation(
    'createComment',
    formatTicketCommentGQL(ticketComment, ticket, commenterType),
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ['TICKET_COMMENT_MUTATION_REQ', 'TICKET_CREATE_COMMENT_RESP', 'TICKET_COMMENT_MUTATION_ERR'],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,

    },
  );
}

export function resolveGrievanceByComment(id, clientMutationLabel) {
  const mutation = formatMutation(
    'resolveGrievanceByComment',
    `id: "${id}"`,
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [REQUEST(ACTION_TYPE.MUTATION), SUCCESS(ACTION_TYPE.RESOLVE_BY_COMMENT), ERROR(ACTION_TYPE.MUTATION)],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,

    },
  );
}

export function reopenTicket(id, clientMutationLabel) {
  const mutation = formatMutation(
    'reopenTicket',
    `id: "${id}"`,
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [REQUEST(ACTION_TYPE.MUTATION), SUCCESS(ACTION_TYPE.REOPEN_TICKET), ERROR(ACTION_TYPE.MUTATION)],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,

    },
  );
}

export function fetchIndividual(mm, id) {
  const fetchIndividualCallable = mm.getRef(FETCH_INDIVIDUAL_REF);
  return fetchIndividualCallable([`id: ${id}`]);
}

export function fetchGrievanceConfiguration(params) {
  const payload = formatQuery('grievanceConfig', params, GRIEVANCE_CONFIGURATION_PROJECTION());
  return graphql(payload, ACTION_TYPE.GET_GRIEVANCE_CONFIGURATION);
}

export function downloadTickets(params) {
  const payload = `
    {
      ticketsExport${!!params && params.length ? `(${params.join(',')})` : ''}
    }`;
  return graphql(payload, ACTION_TYPE.TICKET_EXPORT);
}

export const clearTicket = () => (dispatch) => {
  dispatch({
    type: CLEAR(ACTION_TYPE.CLEAR_TICKET),
  });
};
