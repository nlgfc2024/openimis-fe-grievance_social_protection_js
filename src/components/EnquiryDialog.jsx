import React, { useEffect, Fragment } from 'react';
import { injectIntl } from 'react-intl';
import {
  Dialog, Button, DialogActions, DialogContent,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  formatMessage,
  formatMessageWithValues,
  Contributions,
  Error,
  ProgressOrError,
  withModulesManager,
  withHistory,
} from '@openimis/fe-core';
import { fetchIndividual } from '../actions';
import IndividualSummary from './IndividualSummary';

const StyledEnquiryDialog = styled('div')(() => ({
  '& .summary': {
    marginBottom: 32,
  },
}));

function EnquiryDialog(props) {
  const {
    intl, modulesManager, fetchInindividual, fetching, fetched, individual, error, onClose, open, chfid,
  } = props;

  useEffect(() => {
    if (open && individual?.id !== chfid) {
      fetchInindividual(modulesManager, chfid);
    }
  }, [open, chfid]);

  return (
    <StyledEnquiryDialog>
      <Dialog maxWidth="xl" fullWidth open={open} onClose={onClose}>
        <DialogContent>
          <ProgressOrError progress={fetching} error={error} />
          {!!fetched && !individual && (
            <Error
              error={{
                code: formatMessage(intl, 'insuree', 'notFound'),
                detail: formatMessageWithValues(intl, 'insuree', 'chfidNotFound', { chfid }),
              }}
            />
          )}
          {!fetching && individual && (
            <>
              <IndividualSummary modulesManager={modulesManager} insuree={individual} className="summary" />
              <Contributions contributionKey="insuree.EnquiryDialog" insuree={individual} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            {formatMessage(intl, 'insuree', 'close')}
          </Button>
        </DialogActions>
      </Dialog>
    </StyledEnquiryDialog>
  );
}

const mapStateToProps = (state) => ({
  fetching: state.individual.fetchingIndividual,
  fetched: state.individual.fetchedIndividual,
  individual: state.individual.individual,
  error: state.individual.errorIndividual,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ fetchIndividual }, dispatch);
export default withModulesManager(withHistory(connect(mapStateToProps, mapDispatchToProps)(injectIntl(EnquiryDialog))));
