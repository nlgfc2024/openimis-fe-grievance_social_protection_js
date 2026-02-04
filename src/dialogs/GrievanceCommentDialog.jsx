import React, { useState } from 'react';
import { Grid } from '@mui/material';
import { injectIntl } from 'react-intl';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {
  PublishedComponent,
  TextInput,
  useTranslations,
  useModulesManager,
} from '@openimis/fe-core';
import { styled } from '@mui/material/styles';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import GrievantTypePicker from '../pickers/GrievantTypePicker';
import { MODULE_NAME } from '../constants';

const StyledGrievanceCommentDialog = styled('div')(({ theme }) => ({
  '& .item': theme.paper?.item ?? {},
}));

function GrievanceCommentDialog({
  handleComment,
  openCommentModal,
  handleOpenModal,
  updateCommentAttribute,
  comment,
  updateCommenterType,
  commenterType,
  disabled,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const [benefitPlan, setBenefitPlan] = useState(null);
  return (
    <StyledGrievanceCommentDialog>
      <Button
        onClick={handleOpenModal}
        variant="outlined"
        color="#DFEDEF"
        className="button"
        disabled={disabled}
        style={{
          border: '0px',
          marginTop: '6px',
        }}
      >
        Add Comment to a Grievance
      </Button>
      <Dialog
        open={openCommentModal}
        onClose={handleOpenModal}
        PaperProps={{
          style: {
            width: 1200,
            maxWidth: 1200,
            maxHeight: 900,
          },
        }}
      >
        <form noValidate>
          <DialogTitle
            style={{
              marginTop: '10px',
            }}
          >
            Add Comment to a Grievance
          </DialogTitle>
          <DialogContent>
            <div
              style={{ backgroundColor: '#DFEDEF', paddingLeft: '10px', paddingBottom: '10px' }}
            >
              <Grid size={3} className="item">
                <GrievantTypePicker
                  module={MODULE_NAME}
                  label="type"
                  withNull
                  required
                  value={commenterType?.replace(/\s+/g, '') ?? ''}
                  onChange={(v) => updateCommenterType('commenterType', v)}
                  withLabel
                />
              </Grid>
              {commenterType === 'user' && (
                <Grid size={6} className="item">
                  <PublishedComponent
                    pubRef="admin.UserPicker"
                    value={comment.commenter}
                    module={MODULE_NAME}
                    label={formatMessage('ticket.commenter')}
                    onChange={(v) => updateCommentAttribute('commenter', v)}
                  />
                </Grid>
              )}
              {commenterType === 'individual' && (
                <Grid size={3} className="item">
                  <PublishedComponent
                    pubRef="individual.IndividualPicker"
                    value={comment.reporter}
                    label="ticket.commenter"
                    onChange={(v) => updateCommentAttribute('commenter', v)}
                    required
                    benefitPlan={null}
                  />
                </Grid>
              )}
              {commenterType === 'beneficiary' && (
              <>
                <Grid size={3} className="item">
                  <PublishedComponent
                    pubRef="socialProtection.BenefitPlanPicker"
                    withNull
                    label="socialProtection.benefitPlan"
                    value={benefitPlan}
                    onChange={(v) => setBenefitPlan(v)}
                  />
                </Grid>
                {benefitPlan && (
                <Grid size={3} className="item">
                  <PublishedComponent
                    pubRef="socialProtection.BeneficiaryPicker"
                    value={comment.reporter}
                    label="ticket.commenter"
                    onChange={(v) => updateCommentAttribute('commenter', v)}
                    benefitPlan={benefitPlan}
                  />
                </Grid>
                )}
              </>
              )}
              <Grid size={12} className="item">
                <TextInput
                  label="ticket.comment"
                  value={comment.comment}
                  onChange={(v) => updateCommentAttribute('comment', v)}
                  required
                />
              </Grid>
            </div>
          </DialogContent>
          <DialogActions
            style={{
              display: 'inline',
              paddingLeft: '10px',
              marginTop: '25px',
              marginBottom: '15px',
            }}
          >
            <div style={{ maxWidth: '1200px' }}>
              <div style={{ float: 'left' }}>
                <Button
                  onClick={handleOpenModal}
                  variant="outlined"
                  autoFocus
                  style={{
                    margin: '0 16px',
                    marginBottom: '15px',
                  }}
                >
                  Close
                </Button>
              </div>
              <div style={{ float: 'right', paddingRight: '16px' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={(e) => handleComment(e)}
                  disabled={
                    !(
                      comment?.comment
                    )
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogActions>
        </form>
      </Dialog>
    </StyledGrievanceCommentDialog>
  );
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
}, dispatch);

export { StyledGrievanceCommentDialog };
export default injectIntl(
  connect(mapStateToProps, mapDispatchToProps)(GrievanceCommentDialog),
);
