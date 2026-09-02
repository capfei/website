// Copyright (c) Microsoft Corporation and others. Licensed under the MIT license.
// SPDX-License-Identifier: MIT

import React from 'react'
import PropTypes from 'prop-types'
import { AutoSizer, List, InfiniteLoader } from 'react-virtualized'
import { noRowsHeight } from '../utils/utils'

export default class InfiniteList extends React.Component {
  static propTypes = {
    rowHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
    totalRows: PropTypes.func,
    currentRows: PropTypes.func,
    isRowLoaded: PropTypes.func,
    loadMoreRows: PropTypes.func,
    rowRenderer: PropTypes.func,
    noRowsRenderer: PropTypes.func,
    sortOrder: PropTypes.string,
    contentSeq: PropTypes.number // value upper levels can change to signal non-shallow content change
  }

  static defaultProps = {
    loadMoreRows: () => { }
  }

  constructor(props) {
    super(props)
    this.list = null
    this.registerChild = null
    this.setListRef = this.setListRef.bind(this)
  }

  // Stable ref callback so React doesn't detach/re-attach on every render
  setListRef(element) {
    this.list = element
    if (this.registerChild) {
      this.registerChild(element)
    }
  }

  componentDidUpdate(prevProps) {
    const { contentSeq } = this.props
    // Recompute heights only when contentSeq actually changes
    if (contentSeq !== undefined && contentSeq !== prevProps.contentSeq && this.list) {
      // Defer execution to the next tick to prevent synchronous forceUpdate loops in React
      setTimeout(() => {
        if (this.list) {
          this.list.recomputeRowHeights(0)
        }
      }, 0)
    }
  }

  render() {
    const { isRowLoaded, loadMoreRows, sortOrder, contentSeq, customClassName, threshold } = this.props
    const { totalRows, currentRows, rowHeight, rowRenderer, noRowsRenderer } = this.props

    return (
      <InfiniteLoader
        isRowLoaded={isRowLoaded}
        loadMoreRows={loadMoreRows}
        rowCount={totalRows()}
        threshold={threshold}
      >
        {({ onRowsRendered, registerChild }) => {
          this.registerChild = registerChild
          return (
            <AutoSizer>
              {({ width, height }) => (
                <List
                  aria-checked="false"
                  ref={this.setListRef}
                  className={`${customClassName}`}
                  height={totalRows() === 0 ? noRowsHeight : height}
                  onRowsRendered={onRowsRendered}
                  noRowsRenderer={noRowsRenderer}
                  rowCount={currentRows()}
                  rowHeight={rowHeight}
                  rowRenderer={rowRenderer}
                  width={width}
                  sortOrder={sortOrder}
                  contentSeq={contentSeq}
                />
              )}
            </AutoSizer>
          )
        }}
      </InfiniteLoader>
    )
  }
}