import React, { useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withTheme, withStyles } from '@material-ui/core/styles';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, IconButton,
} from '@material-ui/core';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  formatMessage,
  formatGQLString,
  fetchCustomFilter,
  CustomFilterFieldStatusPicker,
  TextInput,
  NumberInput,
  SelectInput,
} from '@openimis/fe-core';
import { MODULE_NAME } from '../constants';

const EMPTY_CRITERION = { field: '', type: '', value: '' };
const BOOL_OPTIONS = [{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }];

const styles = (theme) => ({
  item: theme.paper.item,
});

/**
 * Advanced Criteria dialog for the Ticket Custom Filter Wizard
 */
function TicketAdvancedCriteriaDialog({
  intl, classes, open, onClose, onApply,
  fetchCustomFilter: doFetchCustomFilter, customFilters,
}) {
  const [criteria, setCriteria] = useState([EMPTY_CRITERION]);

  useEffect(() => {
    if (open) {
      doFetchCustomFilter([
        'moduleName: "grievance_social_protection"',
        'objectTypeName: "Ticket"',
      ]);
    }
  }, [open]);

  const possibleFilters = customFilters?.possibleFilters ?? [];

  const updateCriterion = (index, patch) => {
    setCriteria((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const addCriterion = () => setCriteria((prev) => [...prev, EMPTY_CRITERION]);

  const removeCriterion = (index) => setCriteria((prev) => {
    const next = prev.filter((_, i) => i !== index);
    return next.length ? next : [EMPTY_CRITERION];
  });

  const renderValueInput = (criterion, index) => {
    const onValueChange = (v) => updateCriterion(index, { value: v });
    switch (criterion.type) {
      case 'integer':
        return (
          <NumberInput
            module={MODULE_NAME}
            label="ticket.advancedCriteria.value"
            value={criterion.value}
            onChange={onValueChange}
            min={0}
            displayZero
          />
        );
      case 'boolean':
        return (
          <SelectInput
            module={MODULE_NAME}
            label="ticket.advancedCriteria.value"
            value={criterion.value}
            onChange={onValueChange}
            options={BOOL_OPTIONS}
          />
        );
      case 'string':
      default:
        return (
          <TextInput
            module={MODULE_NAME}
            label="ticket.advancedCriteria.value"
            value={criterion.value}
            onChange={onValueChange}
          />
        );
    }
  };

  const buildConditions = () => criteria
    .filter((c) => c.field && c.value !== '' && c.value !== null && c.value !== undefined)
    .map((c) => {
      const rawValue = c.type === 'string' ? `"${c.value}"` : c.value;
      return `${c.field}__${c.type}=${rawValue}`;
    });

  const handleApply = () => {
    onApply(buildConditions());
    onClose();
  };

  const handleClear = () => {
    setCriteria([EMPTY_CRITERION]);
    onApply([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{formatMessage(intl, MODULE_NAME, 'ticket.advancedCriteria.title')}</DialogTitle>
      <DialogContent>
        {criteria.map((criterion, index) => (
          <Grid
            container
            alignItems="center"
            className={classes.item}
            // eslint-disable-next-line react/no-array-index-key
            key={index}
          >
            <Grid item xs={4} className={classes.item}>
              <CustomFilterFieldStatusPicker
                withNull
                label="ticket.advancedCriteria.field"
                value={{ field: criterion.field, type: criterion.type }}
                onChange={(v) => updateCriterion(index, {
                  field: v?.field ?? '', type: v?.type ?? '', value: '',
                })}
                customFilters={possibleFilters}
              />
            </Grid>
            {criterion.field && (
              <Grid item xs={6} className={classes.item}>
                {renderValueInput(criterion, index)}
              </Grid>
            )}
            <Grid item xs={2} className={classes.item}>
              <IconButton onClick={() => removeCriterion(index)}>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        <Button onClick={addCriterion} startIcon={<AddCircleIcon />}>
          {formatMessage(intl, MODULE_NAME, 'ticket.advancedCriteria.addCriterion')}
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClear}>
          {formatMessage(intl, MODULE_NAME, 'ticket.advancedCriteria.clear')}
        </Button>
        <Button onClick={onClose}>
          {formatMessage(intl, MODULE_NAME, 'ticket.advancedCriteria.cancel')}
        </Button>
        <Button onClick={handleApply} variant="contained" color="primary">
          {formatMessage(intl, MODULE_NAME, 'ticket.advancedCriteria.apply')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function buildCustomFiltersGQLFilter(conditions) {
  if (!conditions || !conditions.length) return null;
  const list = conditions.map((c) => `"${formatGQLString(c)}"`).join(', ');
  return `customFilters: [${list}]`;
}

const mapStateToProps = (state) => ({
  customFilters: state.core.customFilters,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ fetchCustomFilter }, dispatch);

export default injectIntl(
  withTheme(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(TicketAdvancedCriteriaDialog))),
);
