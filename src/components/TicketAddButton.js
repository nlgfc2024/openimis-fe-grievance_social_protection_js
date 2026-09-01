import React from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { MenuItem, Tooltip } from '@material-ui/core';
import {
  useModulesManager,
  useHistory,
  formatMessage,
  historyPush,
} from '@openimis/fe-core';
import { MODULE_NAME, RIGHT_TICKET_ADD } from '../constants';

// Rendered by the Searcher's SelectionMenu (via actionsContributionKey) so the
// "Add" action sits next to the Export button and shares its flat MenuItem style.
function TicketAddButton({ intl, rights }) {
  const modulesManager = useModulesManager();
  const history = useHistory();

  if (!rights.includes(RIGHT_TICKET_ADD)) return null;

  const onAdd = () => historyPush(
    modulesManager,
    history,
    'grievanceSocialProtection.route.ticket',
  );

  return (
    <Tooltip title={formatMessage(intl, MODULE_NAME, 'addNewticketTooltip')}>
      <div>
        <MenuItem onClick={onAdd}>
          {formatMessage(intl, MODULE_NAME, 'tickets.searcherAddAction')}
        </MenuItem>
      </div>
    </Tooltip>
  );
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});

export default injectIntl(connect(mapStateToProps)(TicketAddButton));
