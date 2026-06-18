import React, { Fragment } from 'react';
import { injectIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import { Grid, Box, Typography } from '@mui/material';
import {
  formatMessage,
  withModulesManager,
  formatDateFromISO,
  Contributions,
  ControlledField,
} from '@openimis/fe-core';

const INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY = 'insuree.InsureeSummaryAvatar';
const INSUREE_SUMMARY_CORE_CONTRIBUTION_KEY = 'insuree.InsureeSummaryCore';
const INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY = 'insuree.InsureeSummaryExt';
const INSUREE_SUMMARY_CONTRIBUTION_KEY = 'insuree.InsureeSummary';

const StyledIndividualSummary = styled('div')(() => ({
  '& .label': {
    textAlign: 'right',
  },
}));

function IndividualSummary(props) {
  const {
    insuree, intl, modulesManager, className,
  } = props;
  const hasAvatarContribution = modulesManager.getContribs(INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY).length > 0;
  const hasExtContributions = modulesManager.getContribs(INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY).length > 0;
  return (
    <StyledIndividualSummary>
      <Grid container className={className}>
        {hasAvatarContribution && (
          <Box mr={3}>
            <Contributions readOnly photo={insuree.photo} contributionKey={INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY} />
          </Box>
        )}
        <Box flexGrow={1}>
          <ControlledField
            module="insuree"
            id="InsureeSummary.chfId"
            field={(
              <Typography className="rawValue" variant="h4">
                {insuree.chfId}
              </Typography>
            )}
          />
          <Grid container size={12} spacing={5}>
            <Grid>
              <div>
                <Box>
                  <Typography className="rawValue" variant="h6">
                    {insuree && (
                      <>
                        <ControlledField
                          module="insuree"
                          id="InsureeSummary.otherNames"
                          field={`${insuree.otherNames} `}
                        />
                        <ControlledField module="insuree" id="InsureeSummary.lastName" field={insuree.lastName} />
                      </>
                    )}
                  </Typography>
                </Box>
                <Box>
                  <Typography className="rawValue">
                    <>
                      <ControlledField
                        module="insuree"
                        id="InsureeSummary.dob"
                        field={formatDateFromISO(modulesManager, intl, insuree.dob)}
                      />
                      <ControlledField
                        module="insuree"
                        id="InsureeSummary.age"
                        field={` (${insuree.age} ${formatMessage(intl, 'insuree', 'ageUnit')})`}
                      />
                    </>
                  </Typography>
                </Box>
                <Box>
                  <ControlledField
                    module="insuree"
                    id="InsureeSummary.gender"
                    field={(
                      <Grid size={12}>
                        <Typography className="rawValue">{insuree.gender?.gender}</Typography>
                      </Grid>
                    )}
                  />
                </Box>

                <Contributions contributionKey={INSUREE_SUMMARY_CORE_CONTRIBUTION_KEY} insuree={insuree} />
              </div>
            </Grid>
            {hasExtContributions && (
              <Grid>
                <Contributions contributionKey={INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY} insuree={insuree} />
              </Grid>
            )}
          </Grid>
        </Box>
        <Grid size={12}>
          <Contributions contributionKey={INSUREE_SUMMARY_CONTRIBUTION_KEY} insuree={insuree} />
        </Grid>
      </Grid>
    </StyledIndividualSummary>
  );
}

export { INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY };
export default withModulesManager(injectIntl(IndividualSummary));
