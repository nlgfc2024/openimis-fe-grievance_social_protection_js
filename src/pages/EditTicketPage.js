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

// `resolution` is an SLA target stored as a "days,hours" string
// (days 0-98, hours 0-23). Edited via two number inputs; recombined on change.
const parseResolution = (value) => {
  const match = /^(\d{1,2}),(\d{1,2})$/.exec(value || '');
  return match
    ? { days: Number(match[1]), hours: Number(match[2]) }
    : { days: null, hours: null };
};

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

  updateResolutionPart = (part, raw) => {
    const current = parseResolution(this.state.stateEdited.resolution);
    const next = {
      ...current,
      [part]: (raw === null || raw === undefined || raw === '') ? null : Number(raw),
    };
    const value = (next.days === null && next.hours === null)
      ? null
      : `${next.days ?? 0},${next.hours ?? 0}`;
    this.updateAttribute('resolution', value);
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
    const resolution = parseResolution(stateEdited.resolution);

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
                        <IconButton
                          variant="contained"
                          component="label"
                          onClick={handlePrint}
                        >
                          <PrintIcon />
                        </IconButton>
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
                    onChange={(v) => this.updateAttribute('category', v)}
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
                <Grid item xs={6} className={classes.item}>
                  <NumberInput
                    module={MODULE_NAME}
                    label="ticket.resolutionDays"
                    value={resolution.days}
                    onChange={(v) => this.updateResolutionPart('days', v)}
                    min={0}
                    max={98}
                    allowDecimals={false}
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <NumberInput
                    module={MODULE_NAME}
                    label="ticket.resolutionHours"
                    value={resolution.hours}
                    onChange={(v) => this.updateResolutionPart('hours', v)}
                    min={0}
                    max={23}
                    allowDecimals={false}
                    readOnly={propsReadOnly}
                  />
                </Grid>
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
                {requiresWageAmount && (
                  <Grid item xs={4} className={classes.item}>
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
