/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-underscore-dangle */
import React, { Component } from 'react';
import _debounce from 'lodash/debounce';
import { styled } from '@mui/material/styles';
import { injectIntl } from 'react-intl';
import { Grid, Checkbox, FormControlLabel } from '@mui/material';
import {
  withModulesManager,
  Contributions,
  ControlledField,
  TextInput,
  PublishedComponent,
  decodeId,
  formatMessage,
  GRID_RESPONSIVE_STANDARD,
  GRID_RESPONSIVE_SMALL,
} from '@openimis/fe-core';
import { MODULE_NAME } from '../constants';

const StyledTicketFilter = styled('div')(({ theme }) => ({
  '& .dialogTitle': theme.dialog?.title ?? {},
  '& .dialogContent': theme.dialog?.content ?? {},
  '& .form': {
    padding: 0,
  },
  '& .item': {
    padding: theme.spacing(1),
  },
  '& .paperDivider': theme.paper?.divider ?? {},
}));

const TICKET_FILTER_CONTRIBUTION_KEY = 'ticket.Filter';

class TicketFilter extends Component {
  debouncedOnChangeFilter = _debounce(
    this.props.onChangeFilters,
    this.props.modulesManager.getConf('fe-grievance_social_protection', 'debounceTime', 800),
  );

  _filterValue = (k) => {
    const { filters } = this.props;
    return !!filters && !!filters[k] ? filters[k].value : null;
  };

  _onChangeReporter = (k, v) => {
    this.props.onChangeFilters([
      {
        id: k,
        value: v,
        filter: `${k}: "${decodeId(v?.id)}"`,
      },
    ]);
  };

  _onChangeCheckbox = (key, value) => {
    const filters = [
      {
        id: key,
        value,
        filter: `${key}: ${value}`,
      },
    ];
    this.props.onChangeFilters(filters);
    this.props.setShowHistoryFilter(value);
  };

  render() {
    const {
      filters, onChangeFilters, intl
    } = this.props;
    return (
      <StyledTicketFilter>
        <Grid container className="form">
          <ControlledField
            module={MODULE_NAME}
            id="ticketFilter.ticketCode"
            field={(
              <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
                <TextInput
                  module={MODULE_NAME}
                  label="ticket.ticketCode"
                  name="code"
                  value={this._filterValue('code')}
                  onChange={(v) => this.debouncedOnChangeFilter([
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
              <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
                <TextInput
                  module={MODULE_NAME}
                  label="ticket.ticketTitle"
                  name="title"
                  value={this._filterValue('title')}
                  onChange={(v) => this.debouncedOnChangeFilter([
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
              <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
                <PublishedComponent
                  withLabel
                  withPlaceholder
                  pubRef="individual.IndividualPicker"
                  label={formatMessage(intl, MODULE_NAME, "ticket.searchPerson.label")}
                  placeholder={formatMessage(intl, MODULE_NAME, "ticket.searchPerson.placeholder")}
                  withNull
                  value={this._filterValue('reporterId')}
                  onChange={(v) => this._onChangeReporter(
                    'reporterId',
                    v || null,
                  )}
                />
              </Grid>
            )}
          />
          <ControlledField
            module={MODULE_NAME}
            id="ticketFilter.priority"
            field={(
              <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
                <PublishedComponent
                  pubRef="grievanceSocialProtection.TicketPriorityPicker"
                  withNull
                  label="ticket.ticketPriority"
                  value={this._filterValue('priority')}
                  onChange={(v) => this.debouncedOnChangeFilter([
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
          <ControlledField
            module={MODULE_NAME}
            id="ticket.status"
            field={(
              <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
                <PublishedComponent
                  pubRef="grievanceSocialProtection.TicketStatusPicker"
                  label="ticket.ticketStatus"
                  value={this._filterValue('status')}
                  withNull
                  onChange={(v) => this.debouncedOnChangeFilter([
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
          <ControlledField
            module={MODULE_NAME}
            id="ticket.category"
            field={(
              <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
                <PublishedComponent
                  pubRef="grievanceSocialProtection.DropDownCategoryPicker"
                  withNull
                  value={this._filterValue('category')}
                  onChange={(v) => this.debouncedOnChangeFilter([
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
          <ControlledField
            module={MODULE_NAME}
            id="TicketFilter.showHistory"
            field={(
              <Grid size={GRID_RESPONSIVE_SMALL} className="item">
                <FormControlLabel
                  control={(
                    <Checkbox
                      color="primary"
                      checked={!!this._filterValue('showHistory')}
                      onChange={(event) => this._onChangeCheckbox('showHistory', event.target.checked)}
                    />
                  )}
                  label={formatMessage(this.props.intl, MODULE_NAME, 'showHistory')}
                />
              </Grid>
            )}
          />
          <Contributions
            filters={filters}
            onChangeFilters={onChangeFilters}
            contributionKey={TICKET_FILTER_CONTRIBUTION_KEY}
          />
        </Grid>
      </StyledTicketFilter>
    );
  }
}

export { StyledTicketFilter };
export default withModulesManager(injectIntl(TicketFilter));
