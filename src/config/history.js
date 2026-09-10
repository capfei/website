// Copyright (c) Microsoft Corporation and others. Licensed under the MIT license.
// SPDX-License-Identifier: MIT
import { createBrowserHistory } from 'history'
// PUBLIC_URL is empty at the site root and set to the sub-path when deployed to a GitHub project page.
const history = createBrowserHistory({ basename: process.env.PUBLIC_URL })
export default history
