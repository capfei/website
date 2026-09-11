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
// request never reached the API at all (failed preflight or dropped connection), so nothing was
// written and it is safe to send again. Anything that came back with a status is left alone.
const RETRY_DELAYS_MS = [2000, 5000, 10000]

function retryIfUnsent(attempt, retriesLeft = RETRY_DELAYS_MS.length) {
  return attempt().catch(error => {
    if (error.status || retriesLeft === 0) throw error
    const delay = RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - retriesLeft]
    return new Promise(resolve => setTimeout(resolve, delay)).then(() => retryIfUnsent(attempt, retriesLeft - 1))
  })
}

export function patch(url, token, payload) {
  const body = JSON.stringify(payload)
  return retryIfUnsent(() =>
    fetch(url, {
      headers: getHeaders(token),
      method: 'PATCH',
      body
    }).then(handleResponse)
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

// Some endpoints (notably raw harvest output) can hang for minutes on a cold cache and
// leave the page stuck on a spinner. Fail fast instead so the UI can show an error.
const REQUEST_TIMEOUT_MS = 60000

function fetchWithTimeout(url, options) {
  if (typeof AbortController === 'undefined') return fetch(url, options)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
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

export function get(url, token) {
  return dedupe(`GET:${token ? 'auth' : 'anon'}:${url}`, () =>
    fetchWithTimeout(url, {
      headers: getReadHeaders(token)
    }).then(handleResponse)
  )
}

export function getList(url, token) {
  return dedupe(`LIST:${token ? 'auth' : 'anon'}:${url}`, () =>
    fetchWithTimeout(url, {
      headers: getReadHeaders(token)
    }).then(handleListResponse)
  )
}
