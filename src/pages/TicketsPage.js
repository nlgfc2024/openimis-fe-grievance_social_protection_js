/* eslint-disable react/destructuring-assignment */
import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { withTheme, withStyles } from '@material-ui/core/styles';
import {
  historyPush, withModulesManager, withHistory, decodeId,
} from '@openimis/fe-core';
import TicketSearcher from '../components/TicketSearcher';

const styles = (theme) => ({
  page: theme.page,
});

class TicketsPage extends Component {
  onDoubleClick = (ticket, newTab = false) => {
    const routeParams = ['grievanceSocialProtection.route.ticket', [decodeId(ticket.id)]];
    if (ticket?.isHistory) {
      routeParams[1].push(ticket.version);
    }
    historyPush(this.props.modulesManager, this.props.history, ...routeParams, newTab);
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.page}>
        <TicketSearcher
          cacheFiltersKey="ticketPageFiltersCache"
          onDoubleClick={this.onDoubleClick}
        />
      </div>
    );
  }
}

export default injectIntl(
  withModulesManager(
    withHistory(
      withTheme(withStyles(styles)(TicketsPage)),
    ),
  ),
);
