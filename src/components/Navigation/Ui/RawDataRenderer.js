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
// harvest output can reach tens of megabytes, so beyond this it is served a page at a time.
const MONACO_PAGE_LENGTH = 2 * 1024 * 1024
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

function countLines(text) {
  return (text.match(/\n/g) || []).length
}

// Pages break on line boundaries so the content stays valid-looking and the line
// numbers of each page can continue where the previous one left off.
function paginate(text) {
  const pages = []
  let start = 0
  let firstLine = 1
  while (start < text.length) {
    const boundary = text.indexOf('\n', start + MONACO_PAGE_LENGTH)
    const end = boundary === -1 ? text.length : boundary + 1
    const chunk = text.slice(start, end)
    const lines = countLines(chunk)
    pages.push({ text: chunk, firstLine, lastLine: firstLine + lines - 1 })
    firstLine += lines
    start = end
  }
  return pages
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
  state = { page: 0 }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value || prevProps.type !== this.props.type) this.setState({ page: 0 })
  }

  getPages(text) {
    if (!this.pages || this.pages.source !== text) this.pages = { source: text, list: paginate(text) }
    return this.pages.list
  }

  renderPager(pages, page) {
    const { page: index } = this.state
    const totalLines = pages[pages.length - 1].lastLine
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
        <button
          className="btn btn-default btn-sm"
          disabled={index === 0}
          onClick={() => this.setState({ page: index - 1 })}
        >
          Previous
        </button>
        <button
          className="btn btn-default btn-sm"
          disabled={index >= pages.length - 1}
          onClick={() => this.setState({ page: index + 1 })}
        >
          Next
        </button>
        <span className="text-muted" style={{ marginLeft: '8px' }}>
          Page {index + 1} of {pages.length} &mdash; lines {page.firstLine.toLocaleString()} to{' '}
          {page.lastLine.toLocaleString()} of {totalLines.toLocaleString()}
        </span>
      </div>
    )
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

    const pages = this.getPages(text)
    const index = Math.min(this.state.page, pages.length - 1)
    const page = pages[index] || { text: '', firstLine: 1, lastLine: 1 }
    const isLarge = page.text.length > LARGE_DOCUMENT_LENGTH
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
      renderLineHighlight: isLarge ? 'none' : 'line',
      lineNumbers: number => `${number + page.firstLine - 1}`
    }
    return (
      <div>
        {pages.length > 1 && this.renderPager(pages, page)}
        <Suspense fallback={<PlaceholderRenderer message={`Loading the ${name}`} />}>
          <Editor
            key={index}
            height="400px"
            language={type}
            value={page.text}
            theme="vs-dark"
            options={options}
            editorDidMount={this.editorDidMount}
          />
        </Suspense>
      </div>
    )
  }
}
