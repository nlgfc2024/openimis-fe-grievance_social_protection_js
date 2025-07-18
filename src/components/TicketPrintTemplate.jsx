/* eslint-disable no-nested-ternary */
/* eslint-disable no-undef */
import React, {
  forwardRef,
} from 'react';

import { Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

import {
  useTranslations, useModulesManager,
} from '@openimis/fe-core';
import { MODULE_NAME } from '../constants';

const useStyles = makeStyles(() => ({
  topHeader: {
    display: 'flex',
    justifyContent: 'start',
    alignItems: 'center',
    width: '100%',

    '& img': {
      minWidth: '250px',
      maxWidth: '300px',
      width: 'auto',
      height: 'auto',
    },
  },
  printContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontWeight: '500',
  },
  date: {
    fontSize: '16px',
  },
  detailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    width: '100%',
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px',
  },
  detailName: {
    fontWeight: '600',
    fontSize: '16px',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontWeight: '500',
    backgroundColor: '#f5f5f5',
    padding: '6px',
    borderRadius: '8px',
    fontSize: '15px',
  },
  containerPadding: {
    padding: '32px',
  },
  dividerMargin: {
    margin: '12px 0',
  },
}));

const TicketPrintTemplate = forwardRef(({ ticket, reporter }, ref) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(modulesManager, MODULE_NAME);

  return (
    <div ref={ref} className={classes.containerPadding}>
      <div className={classes.topHeader} />
      <Divider className={classes.dividerMargin} />
      <div className={classes.detailsContainer}>
        <div className={classes.detailRow}>
          <p className={classes.detailName}>{formatMessage('ticket.template.title')}</p>
          <p className={classes.detailValue}>{ticket.title}</p>
        </div>
        <div className={classes.detailRow}>
          <p className={classes.detailName}>{formatMessage('ticket.template.ticketCode')}</p>
          <p className={classes.detailValue}>{ticket.code}</p>
        </div>
        <div className={classes.detailRow}>
          <p className={classes.detailName}>{formatMessage('ticket.template.status')}</p>
          <p className={classes.detailValue}>{ticket.status}</p>
        </div>
        <div className={classes.detailRow}>
          <p className={classes.detailName}>{formatMessage('ticket.template.dateOfIncident')}</p>
          <p className={classes.detailValue}>{ticket.dateOfIncident}</p>
        </div>
        <div className={classes.detailRow}>
          <p className={classes.detailName}>{formatMessage('ticket.template.channel')}</p>
          <p className={classes.detailValue}>{ticket.channel}</p>
        </div>
        <div className={classes.detailRow}>
          <p className={classes.detailName}>{formatMessage('ticket.template.category')}</p>
          <p className={classes.detailValue}>{ticket.category}</p>
        </div>
        <div className={classes.detailRow}>
          <p className={classes.detailName}>{formatMessage('ticket.template.flags')}</p>
          <p className={classes.detailValue}>{ticket.flags}</p>
        </div>
        <div className={classes.detailRow}>
          <p className={classes.detailName}>{formatMessage('ticket.template.priority')}</p>
          <p className={classes.detailValue}>{ticket.priority}</p>
        </div>
        <div className={classes.detailRow}>
          <p className={classes.detailName}>{formatMessage('ticket.template.description')}</p>
          <p className={classes.detailValue}>{ticket.description}</p>
        </div>
        {ticket.reporterTypeName === 'individual' && (
        <div className={classes.detailRow}>
          <p className={classes.detailName}>{formatMessage('ticket.template.reporter')}</p>
          <p className={classes.detailValue}>
            {reporter && reporter.individual
              ? `${reporter.individual.firstName} ${reporter.individual.lastName} ${reporter.individual.dob}`
              : reporter
                ? `${reporter.firstName} ${reporter.lastName} ${reporter.dob}`
                : EMPTY_STRING}
          </p>
        </div>
        )}
        {ticket.reporterTypeName === 'beneficiary' && (
        <div className={classes.detailRow}>
          <p className={classes.detailName}>{formatMessage('ticket.template.reporter')}</p>
          <p className={classes.detailValue}>
            {reporter?.jsonExt?.national_id ?? ''}
          </p>
        </div>
        )}
        {ticket.reporterTypeName === null && (
        <div className={classes.detailRow}>
          <p className={classes.detailName}>{formatMessage('ticket.template.reporter')}</p>
          <p className={classes.detailValue}>{formatMessage('ticket.anonymousUser')}</p>
        </div>
        )}
        <div className={classes.detailRow}>
          <p className={classes.detailName}>{formatMessage('ticket.template.attendingStaff')}</p>
          <p className={classes.detailValue}>{ticket?.attendingStaff?.username}</p>
        </div>
      </div>
    </div>
  );
});

export default TicketPrintTemplate;
