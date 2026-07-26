/* eslint-disable no-nested-ternary */
/* eslint-disable no-undef */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable class-methods-use-this */
import React, { Component, Fragment } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { IconButton, Tooltip } from '@material-ui/core';
import { withStyles, withTheme } from '@material-ui/core/styles';
import {
  coreConfirm,
  formatMessageWithValues,
  journalize,
  Searcher,
  withHistory,
  withModulesManager,
  PublishedComponent,
  formatMessage,
  historyPush,
  decodeId,
} from '@openimis/fe-core';
import EditIcon from '@material-ui/icons/Edit';
// import AddIcon from '@material-ui/icons/Add';
import { MODULE_NAME, RIGHT_TICKET_EDIT } from '../constants';
import { fetchTicketSummaries, resolveTicket, fetchGrievanceConfiguration } from '../actions';
import { isEmptyObject, parseJsonExt } from '../utils/utils';

import TicketFilter from './TicketFilter';
import EnquiryDialog from './EnquiryDialog';

// Columns without a real backing model field (computed server-side, or
// json_ext-backed) aren't sortable via a simple orderBy.
const COLUMN_SORT_FIELD = {
  code: 'code',
  title: 'title',
  category: 'category',
  status: 'status',
  priority: 'priority',
  dueDate: 'dueDate',
  dateCreated: 'dateCreated',
  wageAmount: 'wageAmount',
  reporter: 'reporter_id',
  beneficiary: 'reporter_id',
};

// camelCase config key -> snake_case json_ext key, mirroring the backend's
// own export column resolver (BE-19) so FE display and export stay aligned.
const toSnakeCase = (key) => key.replace(/([A-Z])/g, '_$1').toLowerCase();

const styles = (theme) => ({
  paper: {
    ...theme.paper.paper,
    margin: 0,
  },
  paperHeader: {
    ...theme.paper.header,
    padding: 10,
  },
  tableTitle: theme.table.title,
  fab: theme.fab,
  button: {
    margin: theme.spacing(1),
  },
  item: {
    padding: theme.spacing(1),
  },
});

class TicketSearcher extends Component {
  constructor(props) {
    super(props);
    this.state = {
      enquiryOpen: false,
      // open: false,
      chfid: null,
      confirmedAction: null,
      reset: 0,
      showHistoryFilter: false,
      displayVersion: false,
    };
    this.rowsPerPageOptions = props.modulesManager.getConf(
      'fe-grievance_social_protection',
      'ticketFilter.rowsPerPageOptions',
      [10, 20, 50, 100],
    );
    this.defaultPageSize = props.modulesManager.getConf(
      'fe-grievance_social_protection',
      'ticketFilter.defaultPageSize',
      10,
    );
  }

  componentDidMount() {
    this.props.fetchGrievanceConfiguration();
  }

  // eslint-disable-next-line no-unused-vars
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ reset: prevState.reset + 1 });
    } else if (!prevProps.confirmed && this.props.confirmed) {
      this.state.confirmedAction();
    }
  }

  fetch = (prms) => {
    const { showHistoryFilter } = this.state;
    this.setState({ displayVersion: showHistoryFilter });
    this.props.fetchTicketSummaries(
      this.props.modulesManager,
      prms,
    );
  };

  rowIdentifier = (r) => r.uuid;

  isShowHistory = () => this.state.displayVersion;

  filtersToQueryParams = (state) => {
    const prms = Object.keys(state.filters)
      .filter((f) => !!state.filters[f].filter)
      .map((f) => state.filters[f].filter);
    prms.push(`first: ${state.pageSize}`);
    if (state.afterCursor) {
      prms.push(`after: "${state.afterCursor}"`);
    }
    if (state.beforeCursor) {
      prms.push(`before: "${state.beforeCursor}"`);
    }
    if (state.orderBy) {
      prms.push(`orderBy: ["${state.orderBy}"]`);
    }
    return prms;
  };

  searchResultColumns = () => this.props.grievanceConfig?.searchResultColumns ?? [];

  formatReporter = (ticket) => {
    const reporter = typeof ticket.reporter === 'object'
      ? ticket.reporter : JSON.parse(JSON.parse(ticket.reporter || '{}') || '{}');
    if (ticket.reporterTypeName === 'individual') {
      return (
        <PublishedComponent
          pubRef="individual.IndividualPicker"
          readOnly
          withNull
          label="ticket.reporter"
          required
          value={
            reporter !== undefined
            && reporter !== null ? (isEmptyObject(reporter)
                ? null : reporter) : null
          }
        />
      );
    }
    if (ticket.reporterTypeName === 'beneficiary') {
      return (
        <PublishedComponent
          pubRef="socialProtection.BeneficiaryPicker"
          readOnly
          withNull
          label="ticket.reporter"
          required
          value={
            {
              individual: {
                firstName: ticket.reporterFirstName,
                lastName: ticket.reporterLastName,
                dob: ticket.reporterDob,
              },
            }
          }
        />
      );
    }
    if (ticket.reporterTypeName === 'user') {
      return (
        <PublishedComponent
          pubRef="admin.UserPicker"
          readOnly
          value={
            reporter !== undefined
            && reporter !== null ? (isEmptyObject(reporter)
                ? null : reporter) : null
          }
          module="core"
          label="ticket.reporter"
        />
      );
    }
    if (ticket.reporterTypeName === null) {
      return `${formatMessage(this.props.intl, MODULE_NAME, 'anonymousUser')}`;
    }
    return '';
  };

  formatColumnValue = (ticket, column) => {
    switch (column.key) {
      case 'reporter':
      case 'beneficiary':
        return this.formatReporter(ticket);
      case 'attendingStaff':
        return ticket.attendingStaff?.username ?? '';
      case 'duration':
        return ticket.durationDays ?? '';
      case 'slaState':
        return ticket.slaState ?? '';
      case 'location': {
        const jsonExt = parseJsonExt(ticket.jsonExt);
        return jsonExt.location_name ?? jsonExt.district_name ?? '';
      }
      default:
        if (ticket[column.key] !== undefined) return ticket[column.key];
        return parseJsonExt(ticket.jsonExt)[toSnakeCase(column.key)] ?? '';
    }
  };

  headers = () => [
    ...this.searchResultColumns().map((column) => column.label),
    this.isShowHistory() ? 'tickets.version' : '',
  ];

  sorts = () => [
    ...this.searchResultColumns().map((column) => {
      const field = COLUMN_SORT_FIELD[column.key];
      return field ? [field, true] : null;
    }),
    ['version', true],
  ];

  itemFormatters = () => {
    const formatters = [
      ...this.searchResultColumns().map((column) => (ticket) => this.formatColumnValue(ticket, column)),
      (ticket) => (this.isShowHistory() ? ticket?.version : null),
    ];

    if (this.props.rights.includes(RIGHT_TICKET_EDIT)) {
      formatters.push((ticket) => (
        <Tooltip title={formatMessage(this.props.intl, MODULE_NAME, 'editButtonTooltip')}>
          <IconButton
            disabled={ticket?.isHistory}
            onClick={() => {
              historyPush(
                this.props.modulesManager,
                this.props.history,
                'grievanceSocialProtection.route.ticket',
                [decodeId(ticket.id)],
                false,
              );
            }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      ));
    }
    return formatters;
  };

  rowDisabled = (selection, i) => !!i.validityTo;

  rowLocked = (selection, i) => !!i.clientMutationId;

  render() {
    const {
      intl,
      tickets, ticketsPageInfo, fetchingTickets, fetchedTickets, errorTickets,
      filterPaneContributionsKey, cacheFiltersKey, onDoubleClick,
    } = this.props;

    const count = ticketsPageInfo.totalCount;

    const filterPane = ({ filters, onChangeFilters }) => (
      <TicketFilter
        filters={filters}
        onChangeFilters={onChangeFilters}
        setShowHistoryFilter={(showHistoryFilter) => this.setState({ showHistoryFilter })}
        searchFilters={this.props.grievanceConfig?.searchFilters}
      />
    );

    return (
      <>
        <EnquiryDialog
          open={this.state.enquiryOpen}
          chfid={this.state.chfid}
          onClose={() => {
            this.setState({ enquiryOpen: false, chfid: null });
          }}
        />
        <Searcher
          module={MODULE_NAME}
          cacheFiltersKey={cacheFiltersKey}
          FilterPane={filterPane}
          filterPaneContributionsKey={filterPaneContributionsKey}
          items={tickets}
          itemsPageInfo={ticketsPageInfo}
          fetchingItems={fetchingTickets}
          fetchedItems={fetchedTickets}
          errorItems={errorTickets}
          tableTitle={formatMessageWithValues(intl, MODULE_NAME, 'ticketSummaries', { count })}
          rowsPerPageOptions={this.rowsPerPageOptions}
          defaultPageSize={this.defaultPageSize}
          fetch={this.fetch}
          rowIdentifier={this.rowIdentifier}
          filtersToQueryParams={this.filtersToQueryParams}
          defaultOrderBy="-dateCreated"
          headers={this.headers}
          itemFormatters={this.itemFormatters}
          sorts={this.sorts}
          rowDisabled={this.rowDisabled}
          rowLocked={this.rowLocked}
          onDoubleClick={(i) => !i.clientMutationId && onDoubleClick(i)}
          reset={this.state.reset}
        />
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  tickets: state.grievanceSocialProtection.tickets,
  ticketsPageInfo: state.grievanceSocialProtection.ticketsPageInfo,
  fetchingTickets: state.grievanceSocialProtection.fetchingTickets,
  fetchedTickets: state.grievanceSocialProtection.fetchedTickets,
  errorTickets: state.grievanceSocialProtection.errorTickets,
  submittingMutation: state.grievanceSocialProtection.submittingMutation,
  mutation: state.grievanceSocialProtection.mutation,
  confirmed: state.core.confirmed,
  grievanceConfig: state.grievanceSocialProtection.grievanceConfig,
});

const mapDispatchToProps = (dispatch) => bindActionCreators(
  {
    fetchTicketSummaries, resolveTicket, journalize, coreConfirm, fetchGrievanceConfiguration,
  },
  dispatch,
);

export default withModulesManager(
  withHistory(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(TicketSearcher)))),
  ),
);
