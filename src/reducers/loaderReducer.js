// Copyright (c) Microsoft Corporation and others. Licensed under the MIT license.
// SPDX-License-Identifier: MIT
import get from 'lodash/get'

const initialState = {
  isLoading: 0
}

export default function(state = initialState, action) {
  switch (action.type) {
    case 'UI_INSPECT_GET_CURATIONS':
    case 'UI_INSPECT_GET_DEFINITION':
    case 'UI_INSPECT_GET_HARVESTED':
      const isStart = !get(action, 'error') && !get(action, 'result')
      // Clamp at zero: an unbalanced completion (a request that errors before it is counted,
      // or a component that unmounts mid-flight) would otherwise leave the overlay stuck on.
      const isLoading = Math.max(0, isStart ? state.isLoading + 1 : state.isLoading - 1)
      return { ...state, isLoading }
    default:
      return state
  }
}

export function getLoadingStatus(state) {
  return state.loader.isLoading > 0
}
