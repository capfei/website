// Copyright (c) Microsoft Corporation and others. Licensed under the MIT license.
// SPDX-License-Identifier: MIT

export const ROUTE_ABOUT = '/about'
export const ROUTE_WORKSPACE = '/workspace'
export const ROUTE_DEFINITIONS = '/definitions'
export const ROUTE_SHARE = '/share'
export const ROUTE_HARVEST = '/harvest'
export const ROUTE_CURATIONS = '/curations'
export const ROUTE_DISCORD = '/discord'
export const ROUTE_STATS = '/stats'
export const ROUTE_STATUS = '/status'
export const ROUTE_GETINVOLED = '/get-involved'
export const ROUTE_CHARTER = '/charter'
export const ROUTE_FILE = '/file'
export const ROUTE_ROOT = '/'

// PUBLIC_URL is empty at the site root and set to the sub-path (e.g. /website) when the app is
// deployed to a GitHub Pages project page. Absolute links must include it or they 404.
export const siteUrl = path => `${window.location.origin}${process.env.PUBLIC_URL || ''}${path}`
