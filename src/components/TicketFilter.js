import React, { useState, useRef } from 'react';
import _debounce from 'lodash/debounce';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import {
  Grid, Checkbox, FormControlLabel, Button,
} from '@material-ui/core';
import TuneIcon from '@material-ui/icons/Tune';
import {
  withModulesManager,
  Contributions,
  ControlledField,
  TextInput,
  PublishedComponent,
  decodeId,
  formatMessage,
} from '@openimis/fe-core';
import { MODULE_NAME } from '../constants';
import TicketAdvancedCriteriaDialog, { buildCustomFiltersGQLFilter } from './TicketAdvancedCriteriaDialog';

const styles = (theme) => ({
  dialogTitle: theme.dialog.title,
  dialogContent: theme.dialog.content,
  form: {
    padding: 0,
  },
  item: {
    padding: theme.spacing(1),
  },
  paperDivider: theme.paper.divider,
});

const TICKET_FILTER_CONTRIBUTION_KEY = 'ticket.Filter';

function TicketFilter({
  classes, filters, onChangeFilters, intl, modulesManager, searchFilters, setShowHistoryFilter,
}) {
  const [advancedCriteriaOpen, setAdvancedCriteriaOpen] = useState(false);

  const debouncedOnChangeFilterRef = useRef(null);
  if (!debouncedOnChangeFilterRef.current) {
    debouncedOnChangeFilterRef.current = _debounce(
      onChangeFilters,
      modulesManager.getConf('fe-grievance_social_protection', 'debounceTime', 800),
    );
  }
  const debouncedOnChangeFilter = debouncedOnChangeFilterRef.current;

  const filterValue = (k) => (!!filters && !!filters[k] ? filters[k].value : null);

  const onChangeReporter = (k, v) => {
    onChangeFilters([
      {
        id: k,
        value: v,
        // Guard the cleared case: decodeId(undefined) throws (atob on "undefined"),
        // so drop the filter (null) instead of decoding a missing id.
        filter: v?.id ? `${k}: "${decodeId(v.id)}"` : null,
      },
    ]);
  };

  const onChangeCheckbox = (key, value) => {
    onChangeFilters([
      {
        id: key,
        value,
        filter: `${key}: ${value}`,
      },
    ]);
    setShowHistoryFilter(value);
  };

  const isFilterEnabled = (key) => !searchFilters || searchFilters.includes(key);

  const isAdvancedCriteriaEnabled = () => (
    isFilterEnabled('formNumber')
    || isFilterEnabled('location')
    || isFilterEnabled('nationalId')
  );

  const onApplyAdvancedCriteria = (conditions) => {
    onChangeFilters([
      {
        id: 'customFilters',
        value: conditions,
        filter: buildCustomFiltersGQLFilter(conditions),
      },
    ]);
  };

  return (
    <Grid container className={classes.form}>
      <ControlledField
        module={MODULE_NAME}
        id="ticketFilter.ticketCode"
        field={(
          <Grid item xs={3} className={classes.item}>
            <TextInput
              module={MODULE_NAME}
              label="ticket.ticketCode"
              name="code"
              value={filterValue('code')}
              onChange={(v) => debouncedOnChangeFilter([
                {
                  id: 'code',
                  value: v,
                  filter: `code_Icontains: "${v}"`,
                },
              ])}
            />
          </Grid>
                    )}
      />
      <ControlledField
        module={MODULE_NAME}
        id="ticketFilter.ticketTitle"
        field={(
          <Grid item xs={3} className={classes.item}>
            <TextInput
              module={MODULE_NAME}
              label="ticket.ticketTitle"
              name="title"
              value={filterValue('title')}
              onChange={(v) => debouncedOnChangeFilter([
                {
                  id: 'title',
                  value: v,
                  filter: `title_Icontains: "${v}"`,
                },
              ])}
            />
          </Grid>
                    )}
      />
      <ControlledField
        module={MODULE_NAME}
        id="ticket.reporter"
        field={(
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="individual.IndividualPicker"
              withNull
              label="Individual"
              value={filterValue('reporterId')}
              onChange={(v) => onChangeReporter(
                'reporterId',
                v || null,
              )}
            />
          </Grid>
                    )}
      />
      {isFilterEnabled('priority') && (
      <ControlledField
        module={MODULE_NAME}
        id="ticketFilter.priority"
        field={(
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="grievanceSocialProtection.TicketPriorityPicker"
              withNull
              label="ticket.ticketPriority"
              value={filterValue('priority')}
              onChange={(v) => debouncedOnChangeFilter([
                {
                  id: 'priority',
                  value: v,
                  filter: `priority_Icontains: "${v}"`,
                },
              ])}
            />
          </Grid>
                    )}
      />
      )}
      {isFilterEnabled('status') && (
      <ControlledField
        module={MODULE_NAME}
        id="ticket.status"
        field={(
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="grievanceSocialProtection.TicketStatusPicker"
              value={filterValue('status')}
              withNull
              onChange={(v) => debouncedOnChangeFilter([
                {
                  id: 'status',
                  value: v,
                  filter: `status_Icontains: ${v}`,
                },
              ])}
            />
          </Grid>
                    )}
      />
      )}
      <ControlledField
        module={MODULE_NAME}
        id="ticket.category"
        field={(
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="grievanceSocialProtection.DropDownCategoryPicker"
              withNull
              value={filterValue('category')}
              onChange={(v) => debouncedOnChangeFilter([
                {
                  id: 'category',
                  value: v,
                  filter: `category_Icontains: "${v}"`,
                },
              ])}
            />
          </Grid>
                    )}
      />
      {isFilterEnabled('dateRange') && (
      <>
        <ControlledField
          module={MODULE_NAME}
          id="ticketFilter.dateCreatedFrom"
          field={(
            <Grid item xs={2} className={classes.item}>
              <PublishedComponent
                pubRef="core.DatePicker"
                label="ticket.dateCreatedFrom"
                value={filterValue('dateCreatedFrom')}
                onChange={(v) => debouncedOnChangeFilter([
                  {
                    id: 'dateCreatedFrom',
                    value: v,
                    filter: v ? `dateCreated_Gte: "${v}"` : null,
                  },
                ])}
              />
            </Grid>
                    )}
        />
        <ControlledField
          module={MODULE_NAME}
          id="ticketFilter.dateCreatedTo"
          field={(
            <Grid item xs={2} className={classes.item}>
              <PublishedComponent
                pubRef="core.DatePicker"
                label="ticket.dateCreatedTo"
                value={filterValue('dateCreatedTo')}
                onChange={(v) => debouncedOnChangeFilter([
                  {
                    id: 'dateCreatedTo',
                    value: v,
                    filter: v ? `dateCreated_Lte: "${v}"` : null,
                  },
                ])}
              />
            </Grid>
                    )}
        />
      </>
      )}
      <Grid>
        <ControlledField
          module={MODULE_NAME}
          id="TicketFilter.showHistory"
          field={(
            <Grid item xs={2} className={classes.item}>
              <FormControlLabel
                control={(
                  <Checkbox
                    color="primary"
                    checked={!!filterValue('showHistory')}
                    onChange={(event) => onChangeCheckbox('showHistory', event.target.checked)}
                  />
                              )}
                label={formatMessage(intl, MODULE_NAME, 'showHistory')}
              />
            </Grid>
                  )}
        />
      </Grid>
      {isAdvancedCriteriaEnabled() && (
        <Grid item xs={2} className={classes.item}>
          <Button
            variant="outlined"
            startIcon={<TuneIcon />}
            onClick={() => setAdvancedCriteriaOpen(true)}
          >
            {formatMessage(intl, MODULE_NAME, 'ticket.advancedCriteria.button')}
          </Button>
          <TicketAdvancedCriteriaDialog
            open={advancedCriteriaOpen}
            onClose={() => setAdvancedCriteriaOpen(false)}
            onApply={onApplyAdvancedCriteria}
          />
        </Grid>
      )}
      <Contributions
        filters={filters}
        onChangeFilters={onChangeFilters}
        contributionKey={TICKET_FILTER_CONTRIBUTION_KEY}
      />
    </Grid>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(TicketFilter))));
