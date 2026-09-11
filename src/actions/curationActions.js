// Copyright (c) Microsoft Corporation and others. Licensed under the MIT license.
// SPDX-License-Identifier: MIT

import React from 'react'
import flatten from 'lodash/flatten'

import { asyncActions } from './'
import { curate, getCuration, getCurations, getCurationList, getCurationData } from '../api/clearlyDefined'
import { uiNotificationNew, uiGetCurationData } from '../actions/ui'

export const CURATION_POST = 'CURATION_POST'
export const CURATION_BODIES = 'CURATION_BODIES'

export function getCurationAction(token, entity, name) {
  return dispatch => {
    const actions = asyncActions(name)
    dispatch(actions.start())
    return getCuration(token, entity, { expand: ['prs'] }).then(
      result => dispatch(actions.success(result)),
      error => dispatch(actions.error(error))
    )
  }
}

export function getCurationsAction(token, entities) {
  return dispatch => {
    const actions = asyncActions(CURATION_BODIES)
    dispatch(actions.start())
    return getCurations(token, entities).then(
      result => dispatch(actions.success({ add: result })),
      error => dispatch(actions.error(error))
    )
  }
}

// List all of the curations (if any) using the given coordinates as a pattern to match
export function getCurationListAction(token, entity, name, params) {
  return dispatch => {
    const actions = asyncActions(name)
    dispatch(actions.start())
    return getCurationList(token, entity, params).then(
      result => {
        dispatch(actions.success(result))
        result && result.length > 0 && dispatch(uiGetCurationData(token, entity, result[0].number, true))
      },
      error => dispatch(actions.error(error))
    )
  }
}

// Get the curation in the given PR relative to the specified coordinates
export function getCurationDataAction(token, entity, name, prNumber) {
  return dispatch => {
    const actions = asyncActions(name)
    dispatch(actions.start())
    return getCurationData(token, entity, prNumber).then(
      result => dispatch(actions.success(result)),
      error => dispatch(actions.error(error))
    )
  }
}

export function curateAction(token, spec) {
  return dispatch => {
    const actions = asyncActions(CURATION_POST)
    dispatch(actions.start())
    dispatch(uiNotificationNew({ type: 'info', message: 'Started contribution.', timeout: 5000 }))
    return curate(token, spec).then(
      result => {
        const prMessage = (
          <div>
            <span data-test-id="contribution-success">Successfully contributed</span>{' '}
            <a href={result.url} target="_blank" rel="noopener noreferrer">
              PR#
              {result.prNumber}
            </a>
          </div>
        )
        dispatch(actions.success(result))
        dispatch(
          uiNotificationNew({
            type: 'info',
            message: prMessage,
            timeout: 10000
          })
        )
      },
      error => {
        dispatch(actions.error(error))
        if (error.status === 400) {
          const errors = flatten(error.body.errors)
          const { patchesInError } = error.body
          errors.forEach(e => {
            dispatch(
              uiNotificationNew({
                type: 'danger',
                message: `Contribution ERROR: ${e.error.message}`,
                code: patchesInError
              })
            )
          })
        } else {
          const reason = error.status ? `${error.status} ${error.statusText || error.message}` : error.message
          // A timeout or CORS failure means the browser gave up, not that the API did -- the PR
          // may still have been opened, so warn before the user resubmits and creates a duplicate.
          const timedOut = !error.status || [502, 503, 504, 524].includes(error.status)
          dispatch(
            uiNotificationNew({
              type: 'danger',
              message: timedOut
                ? `Failed contribution: ${reason ||
                'the API did not respond'}. It may still have been submitted -- check the curations for this component before trying again.`
                : `Failed contribution: ${reason}`,
              timeout: 15000
            })
          )
        }
      }
    )
  }
}
