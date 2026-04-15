// Disable due to core architecture
/* eslint-disable camelcase */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { FormattedMessage, GetIconComponent } from '@openimis/fe-core';
const ListAlt = GetIconComponent("ListAlt");
const AddCircleOutline = GetIconComponent("AddCircleOutline");
import messages_en from './translations/en.json';
import reducer from './reducer';
import TicketsPage from './pages/TicketsPage';
import TicketPage from './pages/TicketPage';
import TicketSearcher from './components/TicketSearcher';
import TicketPriorityPicker from './pickers/TicketPriorityPicker';
import TicketStatusPicker from './pickers/TicketStatusPicker';
import CategoryPicker from './pickers/CategoryPicker';
import GrievanceConfigurationDialog from './dialogs/GrievanceConfigurationDialog';
import ChannelPicker from './pickers/ChannelPicker';
import FlagPicker from './pickers/FlagsPicker';
import {
  MODULE_NAME,
  RIGHT_TICKET_ADD,
  RIGHT_TICKET_SEARCH,
} from './constants';

const ROUTE_TICKET_TICKETS = 'ticket/tickets';
const ROUTE_TICKET_TICKET = 'ticket/ticket';
const ROUTE_TICKET_NEW_TICKET = 'ticket/newTicket';

const DEFAULT_CONFIG = {
  translations: [{ key: 'en', messages: messages_en }],
  reducers: [{ key: 'grievanceSocialProtection', reducer }],

  refs: [
    { key: 'grievanceSocialProtection.route.tickets', ref: ROUTE_TICKET_TICKETS },
    { key: 'grievanceSocialProtection.route.ticket', ref: ROUTE_TICKET_TICKET },

    { key: 'grievanceSocialProtection.route.ticketSearcher', ref: TicketSearcher },

    { key: 'grievanceSocialProtection.TicketStatusPicker', ref: TicketStatusPicker },
    { key: 'grievanceSocialProtection.TicketPriorityPicker', ref: TicketPriorityPicker },
    { key: 'grievanceSocialProtection.DropDownCategoryPicker', ref: CategoryPicker },
    { key: 'grievanceSocialProtection.CategoryPicker', ref: CategoryPicker },
    { key: 'grievanceSocialProtection.FlagPicker', ref: FlagPicker },
    { key: 'grievanceSocialProtection.ChannelPicker', ref: ChannelPicker },
    { key: 'grievanceSocialProtection.GrievanceConfigurationDialog', ref: GrievanceConfigurationDialog },

  ],
  'core.Router': [
    { path: ROUTE_TICKET_TICKETS, text: "menu.grievance.grievances", id: 'grievance.grievances', component: TicketsPage, rights: [RIGHT_TICKET_SEARCH], icon: "ListAlt" },
    { path: `${ROUTE_TICKET_TICKET}/:ticket_uuid?/:version?`, component: TicketPage, rights: [RIGHT_TICKET_SEARCH], icon: "ListAlt" },
    { path: ROUTE_TICKET_NEW_TICKET, text: "menu.grievance.add", id: 'grievance.add', component: TicketPage, rights: [RIGHT_TICKET_ADD], icon: "AddCircleOutline" },
  ],
  'core.MainMenu': [{ name: 'GrievanceMainMenu', text: `${MODULE_NAME}.mainMenuGrievance`, id: "grievance.MainMenu" }],
  'grievance.MainMenu': [
    {
      route: ROUTE_TICKET_TICKETS,
    },
    {
      route: ROUTE_TICKET_NEW_TICKET,
    },
  ],

};

export const GrievanceSocialProtectionModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });
