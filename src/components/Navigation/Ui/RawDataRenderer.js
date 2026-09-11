// Copyright (c) Microsoft Corporation and others. Licensed under the MIT license.
// SPDX-License-Identifier: MIT
import React, { Component, Suspense } from 'react'
import PropTypes from 'prop-types'
import yaml from 'js-yaml'
import PlaceholderRenderer from './PlaceholderRenderer'

// Monaco and its workers are only needed on the Raw Data tab, so keep them out of the main bundle.
const Editor = React.lazy(() => import('@monaco-editor/react'))

// Serializing a definition or harvest result can take seconds for large components,
// so it is done on demand and cached against the source object.
const serializedCache = new WeakMap()

// Monaco copes with large documents once the expensive per-line features are off, but raw
// harvest output can reach tens of megabytes, so keep a plain-text escape hatch for those.
const MONACO_MAX_LENGTH = 5 * 1024 * 1024
const LARGE_DOCUMENT_LENGTH = 100 * 1024

function serialize(item, type) {
  const cached = serializedCache.get(item)
  if (cached && cached.type === type) return cached.text
  let text
  try {
    text = type === 'yaml' ? yaml.safeDump(item, { sortKeys: true }) : JSON.stringify(item, null, 2)
  } catch (error) {
    text = `Unable to render this data: ${error.message}`
  }
  serializedCache.set(item, { type, text })
  return text
}

export default class RawDataRenderer extends Component {
  static propTypes = {
    value: PropTypes.object,
    name: PropTypes.string,
    type: PropTypes.string
  }
  static defaultProps = {
    type: 'json'
  }
  render() {
    const { value, name, type } = this.props
    if (!value) return <PlaceholderRenderer message={`Empty data`} />
    if (value.isFetching) return <PlaceholderRenderer message={`Loading the ${name}`} />
    if (value.error && value.error.status !== 404)
      return <PlaceholderRenderer message={`There was a problem loading the ${name}`} />
    if (!value.isFetched)
      return <PlaceholderRenderer message={'Search for some part of a component name to see details'} />
    if (!value.item) return <PlaceholderRenderer message={`No ${name} found`} />

    const text = typeof value.transformed === 'string' ? value.transformed : serialize(value.item, type)

    if (text.length > MONACO_MAX_LENGTH)
      return (
        <div>
          <p className="text-muted">
            This {name} is too large to open in the editor ({Math.round(text.length / 1024 / 1024)} MB).
          </p>
          <pre className="raw-data-plain" style={{ height: '400px', overflow: 'auto', margin: 0 }}>
            {text}
          </pre>
        </div>
      )

    const isLarge = text.length > LARGE_DOCUMENT_LENGTH
    const options = {
      selectOnLineNumbers: true,
      cursorSmoothCaretAnimation: !isLarge,
      cursorStyle: 'block',
      cursorSurroundingLines: 1,
      mouseWheelZoom: true,
      // Each of these costs time proportional to the document length.
      minimap: { enabled: !isLarge },
      folding: !isLarge,
      wordWrap: 'off',
      occurrencesHighlight: !isLarge,
      renderLineHighlight: isLarge ? 'none' : 'line'
    }
    return (
      <Suspense fallback={<PlaceholderRenderer message={`Loading the ${name}`} />}>
        <Editor
          height="400px"
          language={type}
          value={text}
          theme="vs-dark"
          options={options}
          editorDidMount={this.editorDidMount}
        />
      </Suspense>
    )
  }
}
