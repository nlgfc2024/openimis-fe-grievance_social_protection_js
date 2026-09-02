// Disabled due to consistency with other modules
/* eslint-disable default-param-last */

import {
  parseData, pageInfo, formatServerError, formatGraphQLError,
  dispatchMutationReq, dispatchMutationResp, dispatchMutationErr,
  decodeId,
} from '@openimis/fe-core';
import {
  CLEAR, ERROR, REQUEST, SUCCESS,
} from './utils/action-type';

// Wrap fe-core's mutation dispatch helpers so the store also carries a
// resolved error (if any) for the current mutation. Pages read `mutationError`
// on the submittingMutation true->false transition to raise a coreAlert.
const mutationReq = (state, action) => ({
  ...dispatchMutationReq(state, action),
  mutationError: null,
});

const mutationResp = (state, service, action) => ({
  ...dispatchMutationResp(state, service, action),
  mutationError: formatGraphQLError(action.payload),
});

const mutationErr = (state, action) => ({
  ...dispatchMutationErr(state, action),
  submittingMutation: false,
  mutationError: formatServerError(action.payload),
});

export const ACTION_TYPE = {
  GET_GRIEVANCE_CONFIGURATION: 'GET_GRIEVANCE_CONFIGURATION',
  MUTATION: 'GRIEVANCE_SOCIAL_PROTECTION_MUTATION',
  RESOLVE_BY_COMMENT: 'RESOLVE_BY_COMMENT',
  REOPEN_TICKET: 'REOPEN_TICKET',
  CLEAR_TICKET: 'CLEAR_TICKET',
  TICKET_EXPORT: 'TICKET_EXPORT',
};

function reducer(
  state = {
    fetchingTickets: false,
    errorTickets: null,
    fetchedTickets: false,
    tickets: [],
    ticketsPageInfo: { totalCount: 0 },

    fetchingTicket: false,
    errorTicket: null,
    fetchedTicket: false,
    ticket: null,
    ticketPageInfo: { totalCount: 0 },

    fetchingCategory: false,
    fetchedCategory: false,
    errorCategory: null,
    category: [],
    categoryPageInfo: { totalCount: 0 },

    fetchingGrievanceConfig: false,
    fetchedGrievanceConfig: false,
    errorGrievanceConfig: null,
    grievanceConfig: null,

    submittingMutation: false,
    mutation: {},
    mutationError: null,

    fetchingTicketComments: false,
    fetchedTicketComments: false,
    errorTicketComments: null,
    ticketComments: null,

    fetchingTicketsExport: false,
    fetchedTicketsExport: false,
    errorTicketsExport: null,
    ticketsExport: null,
  },
  action,
) {
  switch (action.type) {
    case 'TICKET_TICKETS_REQ':
      return {
        ...state,
        fetchingTickets: true,
        fetchedTickets: false,
        tickets: [],
        ticketsPageInfo: { totalCount: 0 },
        errorTickets: null,
      };
    case 'TICKET_TICKETS_RESP':
      return {
        ...state,
        fetchingTickets: false,
        fetchedTickets: true,
        tickets: parseData(action.payload.data.tickets),
        ticketsPageInfo: pageInfo(action.payload.data.tickets),
        errorTickets: formatGraphQLError(action.payload),
      };
    case 'TICKET_TICKETS_ERR':
      return {
        ...state,
        fetching: false,
        error: formatServerError(action.payload),
      };
    case 'TICKET_TICKET_REQ':
      return {
        ...state,
        fetchingTicket: true,
        fetchedTicket: false,
        ticket: null,
        errorTicket: null,
      };
    case 'TICKET_TICKET_RESP':
      return {
        ...state,
        fetchingTicket: false,
        fetchedTicket: true,
        ticket: parseData(action.payload.data.tickets).map((ticket) => ({
          ...ticket,
          id: decodeId(ticket.id),
        }))?.[0],
        errorTicket: formatGraphQLError(action.payload),
      };
    case CLEAR(ACTION_TYPE.CLEAR_TICKET):
      return {
        ...state,
        fetchingTicket: false,
        fetchedTicket: false,
        ticket: null,
        errorTicket: null,
        fetchingTicketComments: false,
        fetchedTicketComments: false,
        ticketComments: [],
        ticketCommentsPageInfo: { totalCount: 0 },
        errorTicketComments: null,
      };
    case 'COMMENT_COMMENTS_REQ':
      return {
        ...state,
        fetchingTicketComments: false,
        fetchedTicketComments: false,
        ticketComments: state.ticketComments || [],
        ticketCommentsPageInfo: { totalCount: 0 },
        errorTicketComments: null,
      };
    case 'COMMENT_COMMENTS_RESP':
      return {
        ...state,
        fetchingTicketComments: false,
        fetchedTicketComments: true,
        ticketComments: parseData(action.payload.data.comments).map(
          (comment) => ({ ...comment, id: decodeId(comment.id) }),
        ),
        ticketCommentsPageInfo: pageInfo(action.payload.data.comments),
        errorTicketComments: formatGraphQLError(action.payload),
      };
    case 'COMMENT_COMMENTS_ERR':
      return {
        ...state,
        fetchingTicketComments: false,
        ticketComments: [],
        error: formatServerError(action.payload),
      };
    case 'CATEGORY_CATEGORY_REQ':
      return {
        ...state,
        fetchingCategory: true,
        fetchedCategory: false,
        category: [],
        errorCategory: null,
      };
    case 'CATEGORY_CATEGORY_RESP':
      return {
        ...state,
        fetchingCategory: false,
        fetchedCategory: true,
        category: parseData(action.payload.data.category),
        categoryPageInfo: pageInfo(action.payload.data.category),
        errorCategory: formatGraphQLError(action.payload),
      };
    case 'CATEGORY_CATEGORY_ERR':
      return {
        ...state,
        fetching: false,
        error: formatServerError(action.payload),
      };
    case REQUEST(ACTION_TYPE.GET_GRIEVANCE_CONFIGURATION):
      return {
        ...state,
        fetchingGrievanceConfig: true,
        fetchedGrievanceConfig: false,
        errorGrievanceConfig: null,
        grievanceConfig: null,
      };
    case SUCCESS(ACTION_TYPE.GET_GRIEVANCE_CONFIGURATION):
      return {
        ...state,
        fetchingGrievanceConfig: false,
        fetchedGrievanceConfig: true,
        errorGrievanceConfig: null,
        grievanceConfig: action.payload.data.grievanceConfig,
      };
    case ERROR(ACTION_TYPE.GET_GRIEVANCE_CONFIGURATION):
      return {
        ...state,
        fetchingGrievanceConfig: false,
        fetchedGrievanceConfig: false,
        errorGrievanceConfig: formatGraphQLError(action.payload),
        grievanceConfig: null,
      };
    case REQUEST(ACTION_TYPE.MUTATION):
      return mutationReq(state, action);
    case ERROR(ACTION_TYPE.MUTATION):
      return mutationErr(state, action);
    case SUCCESS(ACTION_TYPE.RESOLVE_BY_COMMENT):
      return mutationResp(state, 'resolveGrievanceByComment', action);
    case SUCCESS(ACTION_TYPE.REOPEN_TICKET):
      return mutationResp(state, 'reopenTicket', action);
    case 'TICKET_MUTATION_REQ':
      return mutationReq(state, action);
    case 'TICKET_MUTATION_ERR':
      return mutationErr(state, action);
    case 'TICKET_CREATE_TICKET_RESP':
      return mutationResp(state, 'createTicket', action);
    case 'TICKET_UPDATE_TICKET_RESP':
      return mutationResp(state, 'updateTicket', action);
    case 'TICKET_COMMENT_MUTATION_REQ':
      return mutationReq(state, action);
    case 'TICKET_COMMENT_MUTATION_ERR':
      return mutationErr(state, action);
    case 'TICKET_CREATE_COMMENT_RESP':
      return mutationResp(state, 'createComment', action);
    case REQUEST(ACTION_TYPE.TICKET_EXPORT):
      return {
        ...state,
        fetchingTicketsExport: true,
        fetchedTicketsExport: false,
        ticketsExport: null,
        errorTicketsExport: null,
      };
    case SUCCESS(ACTION_TYPE.TICKET_EXPORT):
      return {
        ...state,
        fetchingTicketsExport: false,
        fetchedTicketsExport: true,
        ticketsExport: action.payload.data.ticketsExport,
        errorTicketsExport: formatGraphQLError(action.payload),
      };
    case ERROR(ACTION_TYPE.TICKET_EXPORT):
      return {
        ...state,
        fetchingTicketsExport: false,
        errorTicketsExport: formatServerError(action.payload),
      };
    default:
      return state;
  }
}

export default reducer;
