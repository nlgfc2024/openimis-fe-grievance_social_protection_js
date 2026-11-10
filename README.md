# openIMIS Frontend Template module
This repository holds the files of the openIMIS Frontend Template module.
It is dedicated to be bootstrap development of [openimis-fe_js](https://github.com/openimis/openimis-fe_js) modules, providing an empty (yet deployable) module.

Please refer to [openimis-fe_js](https://github.com/openimis/openimis-fe_js) to see how to build and and deploy (in developement or server mode).

The module is built with [rollup](https://rollupjs.org/).
In development mode, you can use `yarn link` and `yarn start` to continuously scan for changes and automatically update your development server.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/openimis/openimis-fe-template_js.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/openimis/openimis-fe-template_js/alerts/)

## Limitations

### Category Separator
Category full names use ` > ` as the hierarchy separator (e.g. `Enrollment > Missing Documents`). This is consistent with the backend `CATEGORY_SEPARATOR` constant. Category names must not contain ` > `.

## Grievance intake location filters

The grievance intake form supports these configured workflows:

- PWP: Phase → District → Micro-catchment → Hotspot → Project → Household → Member
- Jobs Now: Phase → District → Traditional Authority (TA) → Project → Household → Member

The fields between Phase and Project are controlled by the grievance backend's
`location_filters` configuration. The frontend reads this configuration from the
`locationFilters` GraphQL field. When `location_filters.enabled` is `false`, the
intake form keeps the original Phase → Project → Household → Member workflow.

PWP configuration must include District, Micro-catchment, and Hotspot levels.
Jobs Now configuration must include District and TA levels. Project searches are
filtered by the selected phase and the deepest selected location.

The Location backend protects the `hotspots` query with permission `121925`.
When PWP location filters are enabled, assign permission `121925` through role
management to every grievance intake role that registers PWP grievances. Do not
remove or bypass the query permission: without it, the Hotspot list is unavailable
and the officer cannot continue to Project selection.
