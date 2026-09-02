/* eslint-disable no-return-assign */
/* eslint-disable no-nested-ternary */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/no-unused-state */
/* eslint-disable no-unused-vars */
/* eslint-disable react/destructuring-assignment */
import React, { Component, useRef } from 'react';
import { injectIntl } from 'react-intl';
import ReactToPrint, { PrintContextConsumer } from 'react-to-print';
import PrintIcon from '@material-ui/icons/Print';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  Grid,
  Paper,
  Typography,
  Divider,
  IconButton,
  Button,
  Tooltip,
} from '@material-ui/core';
import {
  journalize,
  coreAlert,
  formatMessage,
  historyPush,
  withHistory,
  withModulesManager,
  TextInput,
  NumberInput,
  PublishedComponent,
  FormattedMessage,
} from '@openimis/fe-core';
import _ from 'lodash';
import { Save, Cancel } from '@material-ui/icons';
import { updateTicket, fetchTicket, createTicketComment } from '../actions';
import { EMPTY_STRING, MODULE_NAME, TICKET_STATUSES } from '../constants';
import TicketPrintTemplate from '../components/TicketPrintTemplate';
import ParticipantPanel from '../components/ParticipantPanel';
import PartialWagesTaskStatus from '../components/PartialWagesTaskStatus';
import { parseJsonExt } from '../utils/utils';

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: '100%',
  },
});

// `resolution` is the SLA target ("days,hours" string), driven by the
// grievance's category — shown read-only, never captured by hand.
const parseResolution = (value) => {
  const match = /^(\d{1,2}),(\d{1,2})$/.exec(value || '');
  return match
    ? { days: Number(match[1]), hours: Number(match[2]) }
    : { days: null, hours: null };
};

const plural = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;

// "2 days 12 hours" / "3 days" / "6 hours" / "Immediate" / "".
const formatDaysHours = (days, hours) => {
  if (days == null && hours == null) return EMPTY_STRING;
  if (!days && !hours) return 'Immediate';
  return [days && plural(days, 'day'), hours && plural(hours, 'hour')].filter(Boolean).join(' ');
};

// Time a grievance has been open: hour precision from dateCreated while still
// open, day precision (server-computed) once resolved.
const formatTimeElapsed = (ticket) => {
  if (ticket.durationDays == null) return EMPTY_STRING;
  if (ticket.slaState !== 'resolved' && ticket.dateCreated) {
    const ms = Date.now() - new Date(ticket.dateCreated).getTime();
    if (ms >= 0) {
      const totalHours = Math.floor(ms / (1000 * 60 * 60));
      return formatDaysHours(Math.floor(totalHours / 24), totalHours % 24) || '0 hours';
    }
  }
  return plural(ticket.durationDays, 'day');
};

// slaState is 'within' | 'breached' | 'resolved' (computed server-side).
const SLA_STATE_COLOR = {
  within: '#2e7d32',
  breached: '#c62828',
  resolved: '#616161',
};

const categoryResolutionTime = (grievanceConfig, category) => (grievanceConfig
  ?.grievanceDefaultResolutionsByCategory || [])
  .find((entry) => entry.category === category)?.resolutionTime;

class EditTicketPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stateEdited: props.ticket,
      comments: props.comments,
      reporter: {},
      grievanceConfig: {},
    };
  }

  componentDidMount() {
    if (this.props.edited_id) {
      this.setState({ grievanceConfig: this.props.grievanceConfig });
      const jsonExt = parseJsonExt(this.props.ticket.jsonExt);
      this.setState({ stateEdited: { ...this.props.ticket, referredTo: jsonExt.referred_to || null } });
      if (this.props.ticket.reporter) {
        this.setState({ reporter: JSON.parse(JSON.parse(this.props.ticket.reporter || '{}'), '{}') });
      }
    }
  }

  // eslint-disable-next-line no-unused-vars
  componentDidUpdate(prevPops, prevState, snapshort) {
    if (prevPops.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      const { intl, mutationError } = this.props;
      if (mutationError) {
        this.props.coreAlert(
          formatMessage(intl, MODULE_NAME, 'ticket.mutation.error.title'),
          mutationError.detail || mutationError.message
            || formatMessage(intl, MODULE_NAME, 'ticket.mutation.update.error'),
        );
      } else {
        this.props.coreAlert(
          formatMessage(intl, MODULE_NAME, 'ticket.mutation.success.title'),
          formatMessage(intl, MODULE_NAME, 'ticket.mutation.update.success'),
        );
        // Return to the grievances list once the user dismisses the success alert.
        this.redirectAfterAlert = true;
      }
    }
    if (this.redirectAfterAlert && prevPops.alert && !this.props.alert) {
      this.redirectAfterAlert = false;
      historyPush(this.props.modulesManager, this.props.history, 'grievanceSocialProtection.route.tickets');
    }
  }

  save = () => {
    this.props.updateTicket(
      this.state.stateEdited,
      `updated ticket ${this.state.stateEdited.code}`,
    );
  };

  updateAttribute = (k, v) => {
    this.setState((state) => ({
      stateEdited: { ...state.stateEdited, [k]: v },
    }));
  };

  // Category drives the SLA — keep `resolution` in step when it changes
  // (the backend re-derives it authoritatively on save regardless).
  updateCategory = (category) => {
    const resolution = categoryResolutionTime(this.props.grievanceConfig, category);
    this.setState((state) => ({
      stateEdited: {
        ...state.stateEdited,
        category,
        ...(resolution ? { resolution } : {}),
      },
    }));
  };

  goToList = () => {
    historyPush(this.props.modulesManager, this.props.history, 'grievanceSocialProtection.route.tickets');
  };

  doesTicketChange = () => {
    const { ticket } = this.props;
    const { stateEdited } = this.state;
    const baselineReferredTo = parseJsonExt(ticket.jsonExt).referred_to || null;
    return !_.isEqual({ ...ticket, referredTo: baselineReferredTo }, stateEdited);
  };

  render() {
    const {
      classes,
      titleone = ' Ticket.ComplainantInformation',
      titletwo = ' Ticket.DescriptionOfEvents',
      titlethree = ' Ticket.Resolution',
      titleParams = { label: EMPTY_STRING },
      grievanceConfig,
    } = this.props;

    const propsReadOnly = this.props.readOnly;

    const {
      stateEdited, reporter, comments,
    } = this.state;

    const ticketJsonExt = parseJsonExt(stateEdited.jsonExt);
    const wasReferred = !!ticketJsonExt.was_referred;
    const resolution = parseResolution(
      categoryResolutionTime(grievanceConfig, stateEdited.category) || stateEdited.resolution,
    );

    // Walk-in / unregistered complainant captured by hand (no reporter FK).
    const unregisteredReporter = ticketJsonExt.unregistered_reporter;
    const unregisteredReporterAsIndividual = unregisteredReporter && {
      firstName: unregisteredReporter.first_name,
      lastName: unregisteredReporter.last_name,
      dob: unregisteredReporter.dob,
      jsonExt: {
        national_id: unregisteredReporter.national_id,
        household_mobile_number: unregisteredReporter.phone,
      },
    };

    const categoryWorkflow = (grievanceConfig?.grievanceCategoryWorkflows || [])
      .find((workflow) => workflow.category === stateEdited.category);
    const isMakerChecker = !!categoryWorkflow?.makerChecker;
    const requiresWageAmount = !!categoryWorkflow?.requiresAmount;
    const isTerminalStatus = !!(grievanceConfig?.ticketStatuses || [])
      .find((status) => status.code === stateEdited.status)?.terminal;
    const hasWageAmount = stateEdited.wageAmount !== null
      && stateEdited.wageAmount !== undefined && stateEdited.wageAmount !== '';

    return (
      <div className={classes.page}>
        <Grid container>
          <Grid item xs={12}>
            {(stateEdited.reporter || unregisteredReporter) && (
            <Paper className={classes.paper}>
              <Grid container className={classes.tableTitle}>
                <Grid item xs={8} className={classes.tableTitle}>
                  <Typography>
                    <FormattedMessage module={MODULE_NAME} id={titleone} values={titleParams} />
                  </Typography>
                </Grid>
              </Grid>
              <Grid container className={classes.item}>
                {unregisteredReporter && (
                  <Grid item xs={12} className={classes.item}>
                    <Typography variant="caption" color="textSecondary">
                      <FormattedMessage module={MODULE_NAME} id="ticket.manualIndividual.note" />
                    </Typography>
                  </Grid>
                )}
                {stateEdited.reporterTypeName === 'individual' && (
                <Grid item xs={3} className={classes.item}>
                  <PublishedComponent
                    pubRef="individual.IndividualPicker"
                    value={reporter}
                    onChange={(v) => this.updateAttribute('reporter', v)}
                    label="Complainant"
                    readOnly
                  />
                </Grid>
                )}
              </Grid>
              <Divider />
              <Grid container className={classes.item}>
                {stateEdited.reporterTypeName === 'individual' && (
                  <ParticipantPanel
                    participantFields={this.props.grievanceConfig?.participantFields}
                    reporter={reporter}
                    ticketJsonExt={stateEdited.jsonExt}
                  />
                )}
                {stateEdited.reporterTypeName === 'beneficiary' && (
                <>
                  <PublishedComponent
                    pubRef="socialProtection.BeneficiaryPicker"
                    onChange={(v) => this.updateAttribute('reporter', v)}
                    readOnly
                    value={
                      {
                        individual: {
                          firstName: stateEdited.reporterFirstName,
                          lastName: stateEdited.reporterLastName,
                          dob: stateEdited.reporterDob,
                        },
                      }
                    }
                    module={MODULE_NAME}
                  />
                  <ParticipantPanel
                    participantFields={this.props.grievanceConfig?.participantFields}
                    reporter={{
                      individual: {
                        firstName: stateEdited.reporterFirstName,
                        lastName: stateEdited.reporterLastName,
                        dob: stateEdited.reporterDob,
                      },
                    }}
                    ticketJsonExt={stateEdited.jsonExt}
                  />
                </>
                )}
                {stateEdited.reporterTypeName === 'user' && (
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="admin.UserPicker"
                    value={reporter}
                    module="core"
                    onChange={(v) => this.updateAttribute('reporter', v)}
                    readOnly
                  />
                </Grid>
                )}
                {!stateEdited.reporter && unregisteredReporter && (
                  <>
                    <Grid item xs={3} className={classes.item}>
                      <TextInput
                        module={MODULE_NAME}
                        label="ticket.manualIndividual.firstName"
                        value={unregisteredReporter.first_name || EMPTY_STRING}
                        onChange={() => {}}
                        readOnly
                      />
                    </Grid>
                    <Grid item xs={3} className={classes.item}>
                      <TextInput
                        module={MODULE_NAME}
                        label="ticket.manualIndividual.lastName"
                        value={unregisteredReporter.last_name || EMPTY_STRING}
                        onChange={() => {}}
                        readOnly
                      />
                    </Grid>
                    <Grid item xs={3} className={classes.item}>
                      <TextInput
                        module={MODULE_NAME}
                        label="ticket.manualIndividual.dob"
                        value={unregisteredReporter.dob || EMPTY_STRING}
                        onChange={() => {}}
                        readOnly
                      />
                    </Grid>
                    <ParticipantPanel
                      participantFields={this.props.grievanceConfig?.participantFields}
                      reporter={unregisteredReporterAsIndividual}
                      ticketJsonExt={stateEdited.jsonExt}
                    />
                  </>
                )}
              </Grid>
            </Paper>
            )}
          </Grid>
        </Grid>

        <Grid container>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <Grid container className={classes.tableTitle} alignItems="center">
                <Grid item xs={8} className={classes.tableTitle}>
                  <Typography>
                    <FormattedMessage
                      module={MODULE_NAME}
                      id={titletwo}
                      values={titleParams}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={4} style={{ textAlign: 'right' }}>
                  <ReactToPrint content={() => this.componentRef}>
                    <PrintContextConsumer>
                      {({ handlePrint }) => (
                        <Tooltip title={formatMessage(this.props.intl, MODULE_NAME, 'ticket.printGrievance.tooltip')}>
                          <IconButton onClick={handlePrint}>
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </PrintContextConsumer>
                  </ReactToPrint>
                </Grid>
              </Grid>
              <Divider />
              <Grid container className={classes.item}>
                <Grid item xs={6} className={classes.item}>
                  <TextInput
                    label="ticket.title"
                    value={stateEdited.title}
                    onChange={(v) => this.updateAttribute('title', v)}
                    required
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="core.DatePicker"
                    label="ticket.dateOfIncident"
                    value={stateEdited.dateOfIncident}
                    required={false}
                    onChange={(v) => this.updateAttribute('dateOfIncident', v)}
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.DropDownCategoryPicker"
                    value={stateEdited.category}
                    onChange={(v) => this.updateCategory(v)}
                    required={false}
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.ChannelPicker"
                    value={stateEdited.channel}
                    onChange={(v) => this.updateAttribute('channel', v)}
                    required
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.TicketPriorityPicker"
                    value={stateEdited.priority}
                    onChange={(v) => this.updateAttribute('priority', v)}
                    required={false}
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.AttendingStaffPicker"
                    category={stateEdited.category}
                    ticketJsonExt={stateEdited.jsonExt}
                    value={stateEdited.attendingStaff}
                    onChange={(v) => this.updateAttribute('attendingStaff', v)}
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.TicketStatusPicker"
                    value={stateEdited.status}
                    onChange={(v) => this.updateAttribute('status', v)}
                    required={false}
                    readOnly={propsReadOnly}
                  />
                </Grid>
                {stateEdited.status === TICKET_STATUSES.REFERRED && (
                  <Grid item xs={6} className={classes.item}>
                    <PublishedComponent
                      pubRef="grievanceSocialProtection.ReferralAuthorityPicker"
                      value={stateEdited.referredTo}
                      onChange={(v) => this.updateAttribute('referredTo', v)}
                      required
                      readOnly={propsReadOnly}
                    />
                  </Grid>
                )}
                {requiresWageAmount && (
                  <Grid item xs={6} className={classes.item}>
                    <NumberInput
                      module={MODULE_NAME}
                      label="ticket.wageAmount"
                      value={stateEdited.wageAmount}
                      onChange={(v) => this.updateAttribute('wageAmount', v)}
                      min={0}
                      required={isTerminalStatus}
                      readOnly={propsReadOnly}
                    />
                  </Grid>
                )}
                <Grid item xs={12} className={classes.item}>
                  <TextInput
                    label="ticket.description"
                    value={stateEdited.description}
                    onChange={(v) => this.updateAttribute('description', v)}
                    required={false}
                    readOnly={propsReadOnly}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Grid container>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <Grid container className={classes.tableTitle}>
                <Grid item xs={12} className={classes.tableTitle}>
                  <Typography>
                    <FormattedMessage
                      module={MODULE_NAME}
                      id={titlethree}
                      values={titleParams}
                    />
                  </Typography>
                </Grid>
              </Grid>
              <Divider />
              <Grid container className={classes.item}>
                <Grid item xs={3} className={classes.item}>
                  <TextInput
                    module={MODULE_NAME}
                    label="ticket.resolutionPeriod"
                    value={formatDaysHours(resolution.days, resolution.hours)}
                    onChange={() => {}}
                    readOnly
                  />
                </Grid>
                {!!stateEdited.id && (
                  <>
                    <Grid item xs={3} className={classes.item}>
                      <PublishedComponent
                        pubRef="core.DatePicker"
                        module={MODULE_NAME}
                        label="ticket.dueDate"
                        value={stateEdited.dueDate || null}
                        onChange={() => {}}
                        readOnly
                      />
                    </Grid>
                    <Grid item xs={3} className={classes.item}>
                      <TextInput
                        module={MODULE_NAME}
                        label="ticket.timeElapsed"
                        value={formatTimeElapsed(stateEdited)}
                        onChange={() => {}}
                        readOnly
                      />
                    </Grid>
                    {stateEdited.slaState && (
                      <Grid item xs={3} className={classes.item}>
                        <Typography variant="caption" color="textSecondary" component="div">
                          <FormattedMessage module={MODULE_NAME} id="ticket.slaState" />
                        </Typography>
                        <Typography style={{ color: SLA_STATE_COLOR[stateEdited.slaState], fontWeight: 500 }}>
                          <FormattedMessage module={MODULE_NAME} id={`ticket.slaState.${stateEdited.slaState}`} />
                        </Typography>
                      </Grid>
                    )}
                  </>
                )}
                {wasReferred && (
                  <Grid item xs={12} className={classes.item}>
                    <Typography color="textSecondary">
                      <FormattedMessage
                        module={MODULE_NAME}
                        id="ticket.wasReferredNote"
                        values={{ authority: ticketJsonExt.referred_to }}
                      />
                    </Typography>
                  </Grid>
                )}
                {isMakerChecker && (
                  <Grid item xs={12} className={classes.item}>
                    <PartialWagesTaskStatus ticketId={stateEdited.id} />
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {!propsReadOnly && (
          <Grid container justify="flex-start" spacing={1} className={classes.item}>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={this.save}
                disabled={
                  !this.doesTicketChange()
                  || (stateEdited.status === TICKET_STATUSES.REFERRED && !stateEdited.referredTo)
                  || (requiresWageAmount && isTerminalStatus && !hasWageAmount)
                }
              >
                <FormattedMessage module={MODULE_NAME} id="ticket.updateButton" />
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={this.goToList}
              >
                <FormattedMessage module={MODULE_NAME} id="ticket.cancelButton" />
              </Button>
            </Grid>
          </Grid>
        )}

        <div style={{ display: 'none' }}>
          <TicketPrintTemplate
            ref={(el) => (this.componentRef = el)}
            ticket={stateEdited}
            reporter={reporter}
            comments={comments}
          />
        </div>
      </div>
    );
  }
}

// eslint-disable-next-line no-unused-vars
const mapStateToProps = (state, props) => ({
  submittingMutation: state.grievanceSocialProtection.submittingMutation,
  mutation: state.grievanceSocialProtection.mutation,
  mutationError: state.grievanceSocialProtection.mutationError,
  alert: state.core?.alert,
  fetchingTicket: state.grievanceSocialProtection.fetchingTicket,
  errorTicket: state.grievanceSocialProtection.errorTicket,
  fetchedTicket: state.grievanceSocialProtection.fetchedTicket,
  ticket: state.grievanceSocialProtection.ticket,
  grievanceConfig: state.grievanceSocialProtection.grievanceConfig,
  comments: state.grievanceSocialProtection.ticketComments,
});

const mapDispatchToProps = (dispatch) => bindActionCreators(
  {
    fetchTicket, updateTicket, createTicketComment, journalize, coreAlert,
  },
  dispatch,
);

export default withHistory(
  withModulesManager(
    injectIntl(
      withTheme(
        withStyles(styles)(
          connect(mapStateToProps, mapDispatchToProps)(EditTicketPage),
        ),
      ),
    ),
  ),
);
