// Copyright (c) Microsoft Corporation and others. Licensed under the MIT license.
// SPDX-License-Identifier: MIT

import 'whatwg-fetch'

function getHeaders(token) {
  const result = {
    'Content-Type': 'application/json; charset=utf-8'
  }
  if (token) result.Authorization = 'Bearer ' + token
  return result
}

// GET requests have no body, so Content-Type is meaningless on them -- but sending it makes
// the request non-simple and forces a CORS preflight. The API does not answer OPTIONS on
// every route, so anonymous reads (e.g. /curations) fail outright when it is set. Only send
// headers when there is actually something to send.
function getReadHeaders(token) {
  return token ? { Authorization: 'Bearer ' + token } : undefined
}

export function handleResponse(response) {
  // reject if code is out of range 200-299
  if (!response || !response.ok) {
    const err = new Error(response ? response.statusText : 'Error')
    if (response) {
      err.status = response.status
      return response
        .json()
        .then(body => {
          err.body = body
          throw err
        })
        .catch(() => {
          throw err
        })
    }
    throw err
  }
  if (response.status === 204) {
    // handle NO DATA
    const err = new Error(response ? response.statusText : 'No data')
    err.status = 204
    throw err
  }
  return response.json()
}

async function handleListResponse(response) {
  const list = await handleResponse(response)
  return { list, headers: response.headers }
}

// export function put(url, token, payload) {
//   return fetch(url, {
//     headers: getHeaders(token),
//     method: 'PUT',
//     body: JSON.stringify(payload)
//   })
//     .then(handleResponse)
// }

export function post(url, token, payload) {
  return fetch(url, {
    headers: getHeaders(token),
    method: 'POST',
    body: JSON.stringify(payload)
  }).then(handleResponse)
}

// The API frequently stalls until the CDN times it out. A rejection with no `status` means the
// request never reached the API at all (failed preflight, timeout or dropped connection), so
// nothing was written and it is safe to send again.
const WRITE_RETRY_DELAYS_MS = [2000, 5000, 10000]
const READ_RETRY_DELAYS_MS = [1000, 3000, 5000, 8000]
const GATEWAY_ERRORS = [502, 503, 504, 524]

function retry(attempt, shouldRetry, delays) {
  return attempt().catch(error => {
    if (!delays.length || !shouldRetry(error)) throw error
    const [delay, ...remaining] = delays
    return new Promise(resolve => setTimeout(resolve, delay)).then(() => retry(attempt, shouldRetry, remaining))
  })
}

const wasNeverSent = error => !error.status

// Reads change nothing, so a gateway error is worth repeating too.
const readFailed = error => !error.status || GATEWAY_ERRORS.includes(error.status)

export function patch(url, token, payload) {
  const body = JSON.stringify(payload)
  return retry(
    () =>
      fetch(url, {
        headers: getHeaders(token),
        method: 'PATCH',
        body
      }).then(handleResponse),
    wasNeverSent,
    WRITE_RETRY_DELAYS_MS
  )
}

// export function del(url, token) {
//   return fetch(url, {
//     headers: getHeaders(token),
//     method: 'DELETE'
//   })
//     .then(handleResponse)
// }

// Detail pages remount often (tab switches, route changes) and fire the same GETs again.
// Sharing the promise for identical in-flight requests avoids duplicate multi-megabyte
// downloads without introducing a stale cache.
const inFlight = new Map()

function dedupe(key, request) {
  const pending = inFlight.get(key)
  if (pending) return pending
  const promise = request().then(
    result => {
      inFlight.delete(key)
      return result
    },
    error => {
      inFlight.delete(key)
      throw error
    }
  )
  inFlight.set(key, promise)
  return promise
}

// A healthy API answers reads in well under a second; anything still open after this is the
// stall that the CDN eventually kills at ~125s, so give up early and let the retry take over.
const READ_TIMEOUT_MS = 20000

function fetchWithTimeout(url, options, timeout) {
  if (typeof AbortController === 'undefined') return fetch(url, options)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  return fetch(url, { ...options, signal: controller.signal }).then(
    response => {
      clearTimeout(timer)
      return response
    },
    error => {
      clearTimeout(timer)
      throw error
    }
  )
}

export function get(url, token, { timeout = READ_TIMEOUT_MS } = {}) {
  return dedupe(`GET:${token ? 'auth' : 'anon'}:${url}`, () =>
    retry(
      () => fetchWithTimeout(url, { headers: getReadHeaders(token) }, timeout).then(handleResponse),
      readFailed,
      READ_RETRY_DELAYS_MS
    )
  )
}

export function getList(url, token) {
  return dedupe(`LIST:${token ? 'auth' : 'anon'}:${url}`, () =>
    retry(
      () => fetchWithTimeout(url, { headers: getReadHeaders(token) }, READ_TIMEOUT_MS).then(handleListResponse),
      readFailed,
      READ_RETRY_DELAYS_MS
    )
  )
}
