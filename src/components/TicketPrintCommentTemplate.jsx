/* eslint-disable no-nested-ternary */
/* eslint-disable no-undef */
import React, {
  forwardRef,
} from 'react';

import { Divider } from '@mui/material';
import { styled } from '@mui/material/styles';

import {
  useTranslations, useModulesManager,
} from '@openimis/fe-core';
import { MODULE_NAME } from '../constants';

const StyledTicketPrintCommentTemplate = styled('div')(() => ({
  '& .topHeader': {
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
  '& .printContainer': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontWeight: '500',
  },
  '& .date': {
    fontSize: '16px',
  },
  '& .detailsContainer': {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    width: '100%',
  },
  '& .detailRow': {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px',
  },
  '& .detailName': {
    fontWeight: '600',
    fontSize: '16px',
    textTransform: 'uppercase',
  },
  '& .detailValue': {
    fontWeight: '500',
    backgroundColor: '#f5f5f5',
    padding: '6px',
    borderRadius: '8px',
    fontSize: '15px',
  },
  '& .containerPadding': {
    padding: '32px',
  },
  '& .dividerMargin': {
    margin: '12px 0',
  },
  '& .resolutionComment': {
    color: '#d9534f',
    fontWeight: 'bold',
  },
}));

const TicketPrintCommentTemplate = forwardRef(({ ticketComments }, ref) => {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(modulesManager, MODULE_NAME);

  const formatCommenterName = (commenterTypeName, commenter) => {
    if (!commenterTypeName) return 'Anonymous User';

    if (commenterTypeName === 'individual') {
      const commenterData = JSON.parse(JSON.parse(commenter));
      return `Individual: ${commenterData.firstName} ${commenterData.lastName}`;
    }

    if (commenterTypeName === 'user') {
      const commenterData = JSON.parse(JSON.parse(commenter));
      return `User: ${commenterData.username}`;
    }

    return commenterTypeName;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <StyledTicketPrintCommentTemplate>
      <div ref={ref} className="containerPadding">
        <div className="topHeader" />
        <Divider className="dividerMargin" />
        <div className="detailsContainer">
          <div className="detailRow">
            <p className="detailName">{formatMessage('ticket.template.comments')}</p>
            <div className="detailValue">
              {ticketComments?.length > 0 ? (
                ticketComments.map((comment) => (
                  <div
                    key={comment.id}
                    className={comment.isResolution ? 'resolutionComment' : ''}
                    style={{ marginBottom: '8px' }}
                  >
                    <strong>
                      {formatCommenterName(comment.commenterTypeName, comment.commenter)}
                      :
                    </strong>
                    {' '}
                    {comment.comment}
                    <div style={{ fontSize: '12px', color: '#777' }}>
                      {formatDate(comment.dateCreated)}
                    </div>
                  </div>
                ))
              ) : (
                <p>{formatMessage('ticket.template.noComments')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </StyledTicketPrintCommentTemplate>
  );
});

export default TicketPrintCommentTemplate;
