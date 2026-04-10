/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/jsx-props-no-spreading */

import React from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { formatMessage, MainMenuContribution, withModulesManager, GetIconComponent } from '@openimis/fe-core';
import {
  GRIEVANCE_MAIN_MENU_CONTRIBUTION_KEY,
  MODULE_NAME,
  RIGHT_TICKET_ADD,
  RIGHT_TICKET_SEARCH,
} from '../constants';

const AccessAlarmIcon = GetIconComponent("AccessAlarm");

function GrievanceMainMenu(props) {
  return (
    <MainMenuContribution
      {...props}
      icon={<AccessAlarmIcon />}
      header={formatMessage(props.intl, MODULE_NAME, 'mainMenuGrievance')}
      menuId="GrievanceMainMenu"
      contributionKey={GRIEVANCE_MAIN_MENU_CONTRIBUTION_KEY}
    />
  );
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});

export { GrievanceMainMenu };
export default injectIntl(withModulesManager(connect(mapStateToProps)(GrievanceMainMenu)));
