import React from 'react';
import _ from 'lodash';
import { decodeId } from '@openimis/fe-core';

export function ticketLabel(ticket) {
  if (!ticket) return '';
  return `${_.compact([ticket.ticketCode]).join(' ')}${
    ticket.ticketCode ? ` (${ticket.ticketCode})` : ''
  }`;
}

export function isBase64Encoded(str) {
  // Base64 encoded strings can only contain characters from [A-Za-z0-9+/=]
  const base64RegExp = /^[A-Za-z0-9+/=]+$/;
  return base64RegExp.test(str);
}

// Normalise an id that may arrive base64-encoded (relay node id) or already
// decoded (some pickers decode their own). `decodeId` throws on a bare UUID.
export function toRawId(id) {
  if (!id) return null;
  return isBase64Encoded(id) ? decodeId(id) : id;
}

export function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

export function parseJsonExt(jsonExt) {
  if (!jsonExt) return {};
  if (typeof jsonExt === 'object') return jsonExt;
  try {
    return JSON.parse(jsonExt) || {};
  } catch (e) {
    return {};
  }
}

// Active-custom-filters count badge for the Searcher header's Advanced
// Filters button, matching the fe-individual module's own styling.
export function applyNumberCircle(number) {
  return (
    <div style={{
      color: '#ffffff',
      backgroundColor: '#006273',
      borderRadius: '50%',
      padding: '5px',
      minWidth: '40px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontWeight: 'bold',
      fontSize: '12px',
      width: '20px',
      height: '45px',
      marginTop: '7px',
    }}
    >
      {number}
    </div>
  );
}
