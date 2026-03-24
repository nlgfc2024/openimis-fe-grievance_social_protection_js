# openIMIS Frontend Template module
This repository holds the files of the openIMIS Frontend Template module.
It is dedicated to be bootstrap development of [openimis-fe_js](https://github.com/openimis/openimis-fe_js) modules, providing an empty (yet deployable) module.

Please refer to [openimis-fe_js](https://github.com/openimis/openimis-fe_js) to see how to build and and deploy (in developement or server mode).

The module is built with [rollup](https://rollupjs.org/).
In development mode, you can use `yarn link` and `yarn start` to continuously scan for changes and automatically update your development server.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/openimis/openimis-fe-template_js.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/openimis/openimis-fe-template_js/alerts/)

## Limitations

### Category Hierarchy Depth
The `CategoryPicker` component (`src/pickers/CategoryPicker.js`) uses a GraphQL query that fetches up to **4 levels** of category hierarchy. The backend supports arbitrary depth, but GraphQL does not support recursive queries. To support deeper hierarchies, add additional `children { name fullName }` nesting levels to the query.

### Category Separator
Category full names use ` > ` as the hierarchy separator (e.g. `Enrollment > Missing Documents`). This is consistent with the backend `CATEGORY_SEPARATOR` constant. Category names must not contain ` > `.
