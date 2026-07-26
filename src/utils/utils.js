import _ from 'lodash';

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
