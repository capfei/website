// Copyright (c) Microsoft Corporation and others. Licensed under the MIT license.
// SPDX-License-Identifier: MIT

// Delays loading until the store is rehydrated
import React, { Component, Suspense } from 'react'
import { persistStore, createTransform } from 'redux-persist'
import {
  ROUTE_ROOT,
  ROUTE_DEFINITIONS,
  ROUTE_WORKSPACE,
  ROUTE_HARVEST,
  ROUTE_CURATIONS,
  ROUTE_ABOUT,
  ROUTE_DISCORD,
  ROUTE_SHARE,
  ROUTE_STATS,
  ROUTE_STATUS,
  ROUTE_GETINVOLED,
  ROUTE_CHARTER,
  ROUTE_FILE
} from '../utils/routingConstants'
import history from '../config/history'
import { configureStore } from '../configureStore'
import { Provider } from 'react-redux'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { App } from './'
import { omit } from 'lodash'
import withTracker from '../utils/withTracker'

// Each page is loaded on demand so that visiting a single page does not download the
// code (and dependencies such as the editor and charting libraries) for every other page.
const PageAbout = React.lazy(() => import('./PageAbout'))
const PageContribution = React.lazy(() => import('./Navigation/Pages/PageContribution'))
const FullDetailPage = React.lazy(() => import('./FullDetailView/FullDetailPage'))
const PageDefinitions = React.lazy(() => import('./Navigation/Pages/PageDefinitions'))
const PageBrowse = React.lazy(() => import('./Navigation/Pages/PageBrowse'))
const PageStats = React.lazy(() => import('./Navigation/Pages/PageStats'))
const PageStatus = React.lazy(() => import('./Navigation/Pages/PageStatus'))
const PageFile = React.lazy(() => import('./Navigation/Pages/PageFile'))
const PageHarvest = React.lazy(() => import('./Navigation/Pages/PageHarvest'))
const GetInvolved = React.lazy(() => import('./GetInvolved'))
const Charter = React.lazy(() => import('./Charter'))

const store = configureStore()

// * store only SESSION
// * do not persist isFetching from the session
// * state in, state out, whitelist
const transformRemoveFetchErr = createTransform(
  state => omit(state, ['isFetching', 'error']),
  state => state,
  {
    whitelist: ['session']
  }
)

// Store only definitions from ui reducer
const transformUiDefinitions = createTransform(
  state => {
    return { definitions: state.definitions }
  },
  state => state,
  {
    whitelist: ['ui']
  }
)

// Cached definition bodies carry a `files` array that is routinely several megabytes.
// Serializing that to localStorage on every store update blocks the main thread and can
// blow the storage quota, so the file lists are dropped from the cached copy.
const transformStripDefinitionFiles = createTransform(
  state => {
    const entries = state && state.bodies && state.bodies.entries
    if (!entries) return state
    const slimEntries = {}
    for (const path of Object.keys(entries)) {
      slimEntries[path] = omit(entries[path], ['files'])
    }
    return { ...state, bodies: { ...state.bodies, entries: slimEntries } }
  },
  state => state,
  {
    whitelist: ['definition']
  }
)

export default class RehydrationDelayedProvider extends Component {
  constructor(props) {
    super(props)
    this.state = { rehydrated: false }
  }

  componentDidMount() {
    persistStore(
      store,
      {
        whitelist: ['session', 'ui', 'definition'],
        transforms: [transformRemoveFetchErr, transformUiDefinitions, transformStripDefinitionFiles]
      },
      () => {
        this.setState({ rehydrated: true })
      }
    )
  }

  render() {
    if (!this.state.rehydrated) return <div className="loading-site-root">Loading...</div>
    return (
      <Provider store={store} history={history}>
        <Router basename={process.env.PUBLIC_URL}>
          <App className="App">
            <Suspense fallback={<div className="loading-site-root">Loading...</div>}>
              <Switch>
                <Route path={ROUTE_WORKSPACE} component={withTracker(PageDefinitions)} />
                <Route path={ROUTE_DEFINITIONS} exact={true} component={() => (window.location = ROUTE_WORKSPACE)} />
                <Route path={ROUTE_DEFINITIONS} component={withTracker(FullDetailPage)} />
                <Route path={ROUTE_SHARE} component={withTracker(PageDefinitions)} />
                <Route path={ROUTE_CURATIONS} component={withTracker(PageContribution)} />
                <Route path={ROUTE_HARVEST} component={withTracker(PageHarvest)} />
                <Route path={ROUTE_ABOUT} component={withTracker(PageAbout)} />
                <Route path={ROUTE_GETINVOLED} component={withTracker(GetInvolved)} />
                <Route path={ROUTE_CHARTER} component={withTracker(Charter)} />
                <Route path={ROUTE_STATS} component={withTracker(PageStats)} />
                <Route path={ROUTE_STATUS} component={withTracker(PageStatus)} />
                <Route path={ROUTE_DISCORD} component={() => (window.location = 'https://discord.gg/wEzHJku')} />
                <Route path={ROUTE_FILE} component={withTracker(PageFile)} />
                <Route path={ROUTE_ROOT} component={withTracker(PageBrowse)} />
              </Switch>
            </Suspense>
          </App>
        </Router>
      </Provider>
    )
  }
}
