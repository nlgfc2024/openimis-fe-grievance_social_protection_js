/* eslint-disable max-len */
/* eslint-disable react/no-unused-state */
/* eslint-disable no-unused-vars */
/* eslint-disable react/destructuring-assignment */
import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  Grid, Paper, Typography, Divider, Button,
  RadioGroup, FormControlLabel, Radio,
} from '@material-ui/core';
import { Save, Cancel } from '@material-ui/icons';
import {
  TextInput, journalize, coreAlert, PublishedComponent, FormattedMessage, formatMessage, decodeId,
  withHistory, withModulesManager, historyPush,
} from '@openimis/fe-core';
import { createTicket } from '../actions';
import { EMPTY_STRING, MODULE_NAME } from '../constants';
import GrievantTypePicker from '../pickers/GrievantTypePicker';
import ProjectHouseholdPicker from '../pickers/ProjectHouseholdPicker';
import HouseholdMemberPicker from '../pickers/HouseholdMemberPicker';
import ReporterDerivedPanel from '../components/ReporterDerivedPanel';

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: '100%',
  },
});

class AddTicketPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stateEdited: {},
      grievantType: null,
      benefitPlan: null,
      project: null,
      household: null,
      isSaved: false,
      // 'existing' -> pick an individual already in the system;
      // 'manual'   -> capture the complainant's details by hand.
      individualEntryMode: 'existing',
      manualIndividual: {},
    };
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
            || formatMessage(intl, MODULE_NAME, 'ticket.mutation.create.error'),
        );
      } else {
        this.props.coreAlert(
          formatMessage(intl, MODULE_NAME, 'ticket.mutation.success.title'),
          formatMessage(intl, MODULE_NAME, 'ticket.mutation.create.success'),
        );
        // Return to the grievances list once the user dismisses the success alert.
        this.redirectAfterAlert = true;
      }
    }
    if (this.redirectAfterAlert && prevPops.alert && !this.props.alert) {
      this.redirectAfterAlert = false;
      this.goToList();
    }
  }

  isManualIndividual = () => this.state.grievantType === 'individual'
    && this.state.individualEntryMode === 'manual';

  canSave = () => {
    const { stateEdited, manualIndividual, isSaved } = this.state;
    if (isSaved || !stateEdited.channel || !stateEdited.title) return false;
    if (this.isManualIndividual()) {
      return !!manualIndividual.firstName && !!manualIndividual.lastName;
    }
    const needsReporter = ['individual', 'beneficiary', 'user'].includes(stateEdited.reporterType);
    return !needsReporter || !!stateEdited.reporter;
  };

  save = () => {
    const ticket = { ...this.state.stateEdited };
    if (this.isManualIndividual()) {
      // Walk-in / unregistered complainant: send the captured details as their
      // own mutation fields (backend stores them on json_ext)
      const { manualIndividual } = this.state;
      ticket.reporter = null;
      delete ticket.reporterType;
      ticket.reporterFirstName = manualIndividual.firstName;
      ticket.reporterLastName = manualIndividual.lastName;
      ticket.reporterDob = manualIndividual.dob;
      ticket.reporterPhone = manualIndividual.phone;
      ticket.reporterNationalId = manualIndividual.nationalId;
    } else if (this.state.grievantType === 'beneficiary') {
      // The reporter picked through the phase/project/household chain is an
      // Individual (the grievance model can't hold a GroupBeneficiary).
      ticket.reporterType = 'individual';
    }
    this.props.createTicket(
      ticket,
      this.props.grievanceConfig,
      `Created Ticket ${ticket.title}`,
    );
    this.setState({ isSaved: true });
  };

  goToList = () => {
    historyPush(this.props.modulesManager, this.props.history, 'grievanceSocialProtection.route.tickets');
  };

  updateAttribute = (k, v) => {
    this.setState((state) => ({
      stateEdited: { ...state.stateEdited, [k]: v },
      isSaved: false, // Reset isSaved when form is modified
    }));
  };

  updateTypeOfGrievant = (field, value) => {
    this.updateAttribute('reporter', null);
    this.updateAttribute('reporterType', value);
    this.setState({
      grievantType: value,
      benefitPlan: null,
      project: null,
      household: null,
      individualEntryMode: 'existing',
      manualIndividual: {},
    });
  };

  updateIndividualEntryMode = (mode) => {
    this.updateAttribute('reporter', null);
    this.setState({ individualEntryMode: mode, manualIndividual: {} });
  };

  updateManualIndividual = (k, v) => {
    this.setState((state) => ({
      manualIndividual: { ...state.manualIndividual, [k]: v },
      isSaved: false,
    }));
  };

  updateBenefitPlan = (field, value) => {
    this.updateAttribute('reporter', null);
    this.setState({ benefitPlan: value, project: null, household: null });
  };

  updateProject = (value) => {
    this.updateAttribute('reporter', null);
    this.setState({ project: value, household: null });
  };

  updateHousehold = (value) => {
    this.updateAttribute('reporter', null);
    this.setState({ household: value });
  };

  render() {
    const {
      classes,
      intl,
      titleone = ' Ticket.ComplainantInformation',
      titletwo = ' Ticket.DescriptionOfEvents',
      titleParams = { label: EMPTY_STRING },
    } = this.props;

    const {
      stateEdited,
      grievantType,
      benefitPlan,
      project,
      household,
      isSaved,
      individualEntryMode,
      manualIndividual,
    } = this.state;

    const phaseLabel = formatMessage(intl, MODULE_NAME, 'ticket.phase');

    return (
      <div className={classes.page}>
        <Grid container>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <Grid container className={classes.tableTitle}>
                <Grid item xs={8} className={classes.tableTitle}>
                  <Typography>
                    <FormattedMessage module={MODULE_NAME} id={titleone} values={titleParams} />
                  </Typography>
                </Grid>
              </Grid>
              <Grid container className={classes.item}>
                <Grid item xs={3} className={classes.item}>
                  <GrievantTypePicker
                    module={MODULE_NAME}
                    label="type"
                    readOnly={!!stateEdited.id || isSaved}
                    withNull
                    value={grievantType?.replace(/\s+/g, '') ?? ''}
                    onChange={(v) => this.updateTypeOfGrievant('grievantType', v)}
                    withLabel
                  />
                </Grid>
                {grievantType === 'individual' && (
                  <>
                    <Grid item xs={9} className={classes.item} container alignItems="center">
                      <RadioGroup
                        row
                        value={individualEntryMode}
                        onChange={(e) => this.updateIndividualEntryMode(e.target.value)}
                      >
                        <FormControlLabel
                          value="existing"
                          control={<Radio color="primary" />}
                          disabled={isSaved}
                          label={formatMessage(intl, MODULE_NAME, 'ticket.individualEntryMode.existing')}
                        />
                        <FormControlLabel
                          value="manual"
                          control={<Radio color="primary" />}
                          disabled={isSaved}
                          label={formatMessage(intl, MODULE_NAME, 'ticket.individualEntryMode.manual')}
                        />
                      </RadioGroup>
                    </Grid>
                    {individualEntryMode === 'existing' && (
                      <Grid item xs={3} className={classes.item}>
                        <PublishedComponent
                          pubRef="individual.IndividualPicker"
                          value={stateEdited.reporter}
                          label="Complainant"
                          onChange={(v) => this.updateAttribute('reporter', v)}
                          readOnly={isSaved}
                        />
                      </Grid>
                    )}
                    {individualEntryMode === 'manual' && (
                      <>
                        <Grid item xs={3} className={classes.item}>
                          <TextInput
                            module={MODULE_NAME}
                            label="ticket.manualIndividual.firstName"
                            value={manualIndividual.firstName || EMPTY_STRING}
                            onChange={(v) => this.updateManualIndividual('firstName', v)}
                            required
                            readOnly={isSaved}
                          />
                        </Grid>
                        <Grid item xs={3} className={classes.item}>
                          <TextInput
                            module={MODULE_NAME}
                            label="ticket.manualIndividual.lastName"
                            value={manualIndividual.lastName || EMPTY_STRING}
                            onChange={(v) => this.updateManualIndividual('lastName', v)}
                            required
                            readOnly={isSaved}
                          />
                        </Grid>
                        <Grid item xs={3} className={classes.item}>
                          <PublishedComponent
                            pubRef="core.DatePicker"
                            module={MODULE_NAME}
                            label="ticket.manualIndividual.dob"
                            value={manualIndividual.dob || null}
                            onChange={(v) => this.updateManualIndividual('dob', v)}
                            readOnly={isSaved}
                          />
                        </Grid>
                        <Grid item xs={3} className={classes.item}>
                          <TextInput
                            module={MODULE_NAME}
                            label="ticket.manualIndividual.phone"
                            value={manualIndividual.phone || EMPTY_STRING}
                            onChange={(v) => this.updateManualIndividual('phone', v)}
                            readOnly={isSaved}
                          />
                        </Grid>
                        <Grid item xs={3} className={classes.item}>
                          <TextInput
                            module={MODULE_NAME}
                            label="ticket.manualIndividual.nationalId"
                            value={manualIndividual.nationalId || EMPTY_STRING}
                            onChange={(v) => this.updateManualIndividual('nationalId', v)}
                            readOnly={isSaved}
                          />
                        </Grid>
                        <Grid item xs={12} className={classes.item}>
                          <Typography variant="caption" color="textSecondary">
                            <FormattedMessage
                              module={MODULE_NAME}
                              id="ticket.manualIndividual.note"
                            />
                          </Typography>
                        </Grid>
                      </>
                    )}
                  </>
                )}
                {grievantType === 'beneficiary' && (
                  <>
                    <Grid item xs={3} className={classes.item}>
                      <PublishedComponent
                        pubRef="socialProtection.BenefitPlanPicker"
                        withNull
                        withLabel
                        label={phaseLabel}
                        type="GROUP"
                        value={benefitPlan}
                        onChange={(v) => this.updateBenefitPlan('benefitPlan', v)}
                        readOnly={isSaved}
                      />
                    </Grid>
                    {benefitPlan && (
                      <Grid item xs={3} className={classes.item}>
                        <PublishedComponent
                          pubRef="projectSocialProtection.ProjectPicker"
                          benefitPlanId={decodeId(benefitPlan.id)}
                          multiple={false}
                          withLabel
                          label={formatMessage(intl, MODULE_NAME, 'ticket.project')}
                          value={project}
                          onChange={(v) => this.updateProject(v)}
                          readOnly={isSaved}
                        />
                      </Grid>
                    )}
                    {project && (
                      <Grid item xs={3} className={classes.item}>
                        <ProjectHouseholdPicker
                          project={project}
                          value={household}
                          onChange={(v) => this.updateHousehold(v)}
                          readOnly={isSaved}
                        />
                      </Grid>
                    )}
                    {household && (
                      <Grid item xs={3} className={classes.item}>
                        <HouseholdMemberPicker
                          group={household.group}
                          value={stateEdited.reporter}
                          label="Complainant"
                          onChange={(v) => this.updateAttribute('reporter', v)}
                          readOnly={isSaved}
                        />
                      </Grid>
                    )}
                  </>
                )}
                {grievantType === 'user' && (
                  <Grid item xs={6} className={classes.item}>
                    <PublishedComponent
                      pubRef="admin.UserPicker"
                      value={stateEdited.reporter}
                      label="Complainant"
                      onChange={(v) => this.updateAttribute('reporter', v)}
                      benefitPlan={benefitPlan}
                      readOnly={isSaved}
                    />
                  </Grid>
                )}
              </Grid>
              <Divider />
              <Grid container className={classes.item}>
                {(grievantType === 'beneficiary'
                  || (grievantType === 'individual' && individualEntryMode === 'existing'))
                  && stateEdited.reporter && (
                  <ReporterDerivedPanel
                    participantFields={this.props.grievanceConfig?.participantFields}
                    reporter={stateEdited.reporter}
                  />
                )}
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
                    <FormattedMessage module={MODULE_NAME} id={titletwo} values={titleParams} />
                  </Typography>
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
                    readOnly={isSaved}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="core.DatePicker"
                    label="ticket.dateOfIncident"
                    value={stateEdited.dateOfIncident}
                    required={false}
                    onChange={(v) => this.updateAttribute('dateOfIncident', v)}
                    readOnly={isSaved}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.DropDownCategoryPicker"
                    value={stateEdited.category}
                    onChange={(v) => this.updateAttribute('category', v)}
                    required={false}
                    readOnly={isSaved}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.ChannelPicker"
                    value={stateEdited.channel}
                    onChange={(v) => this.updateAttribute('channel', v)}
                    required
                    readOnly={isSaved}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.TicketPriorityPicker"
                    value={stateEdited.priority}
                    onChange={(v) => this.updateAttribute('priority', v)}
                    required={false}
                    readOnly={isSaved}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.AttendingStaffPicker"
                    category={stateEdited.category}
                    value={stateEdited.attendingStaff}
                    onChange={(v) => this.updateAttribute('attendingStaff', v)}
                    readOnly={isSaved}
                  />
                </Grid>
                <Grid item xs={12} className={classes.item}>
                  <TextInput
                    label="ticket.ticketDescription"
                    value={stateEdited.description}
                    onChange={(v) => this.updateAttribute('description', v)}
                    required={false}
                    readOnly={isSaved}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Grid container justify="flex-end" spacing={1} className={classes.item}>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={this.goToList}
            >
              <FormattedMessage module={MODULE_NAME} id="ticket.cancelButton" />
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={this.save}
              disabled={!this.canSave()}
            >
              <FormattedMessage module={MODULE_NAME} id="ticket.saveButton" />
            </Button>
          </Grid>
        </Grid>
      </div>
    );
  }
}

// eslint-disable-next-line no-unused-vars
const mapStateToProps = (state, props) => ({
  submittingMutation: state.grievanceSocialProtection.submittingMutation,
  mutation: state.grievanceSocialProtection.mutation,
  mutationError: state.grievanceSocialProtection.mutationError,
  grievanceConfig: state.grievanceSocialProtection.grievanceConfig,
  alert: state.core?.alert,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ createTicket, journalize, coreAlert }, dispatch);

export default withHistory(
  withModulesManager(
    injectIntl(
      withTheme(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(AddTicketPage))),
    ),
  ),
);
