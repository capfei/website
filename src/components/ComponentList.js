// Copyright (c) Microsoft Corporation and others. Licensed under the MIT license.
// SPDX-License-Identifier: MIT

import React from 'react'
import PropTypes from 'prop-types'
import get from 'lodash/get'
import FormGroup from 'react-bootstrap/lib/FormGroup'
import { RowEntityList, DefinitionEntry } from './'
import EntitySpec from '../utils/entitySpec'
import ComponentButtons from './Navigation/Ui/ComponentButtons'
import { withResize } from '../utils/WindowProvider'
import carrotdownFill from '../images/icons/carrotdownFill.svg'

class ComponentList extends React.Component {
  static propTypes = {
    list: PropTypes.array,
    listLength: PropTypes.number,
    loadMoreRows: PropTypes.func,
    multiSelectEnabled: PropTypes.bool,
    onRemove: PropTypes.func,
    onAddComponent: PropTypes.func,
    onChange: PropTypes.func,
    onInspect: PropTypes.func,
    noRowsRenderer: PropTypes.func,
    renderFilterBar: PropTypes.func,
    definitions: PropTypes.object,
    selected: PropTypes.object,
    sequence: PropTypes.number,
    toggleCheckbox: PropTypes.func,
    curations: PropTypes.object
  }

  static defaultProps = {
    selected: {},
    definitions: { entries: {} },
    curations: { entries: {} },
    list: []
  }

  constructor(props) {
    super(props)
    this.state = { contentSeq: 0, sortOrder: null, changes: {} }
    this.renderRow = this.renderRow.bind(this)
    this.rowHeight = this.rowHeight.bind(this)
    this.onEntryChange = this.onEntryChange.bind(this)
    this.getDefinition = this.getDefinition.bind(this)
  }

  getDefinition(component) {
    const path = EntitySpec.fromObject(component).toPath()
    return get(this.props, `definitions.entries[${path}]`)
  }

  getCuration(component) {
    const path = EntitySpec.fromObject(component).toPath()
    return get(this.props, `curations.entries[${path}]`)
  }

  revertComponent(component, param) {
    const { onRevert } = this.props
    onRevert && onRevert(component, param)
  }

  onEntryChange(component, changes, field) {
    const { onChange } = this.props
    const newComponent = { ...component, changes }
    onChange && onChange(component, newComponent, field)
    this.incrementSequence()
  }

  incrementSequence() {
    this.setState(prevState => ({ contentSeq: prevState.contentSeq + 1 }))
  }

  rowHeight({ index }) {
    const component = get(this.props, `list[${index}]`)
    return component && component.expanded ? 250 * this.props.isMobileMultiplier : 83
  }

  toggleExpanded(component) {
    const { onChange } = this.props
    onChange && onChange(component, { ...component, expanded: !component.expanded })
    this.incrementSequence()
  }

  renderRow({ index, key, style }, toggleExpanded = null, showExpanded = false) {
    const {
      list,
      readOnly,
      hasChange,
      onAddComponent,
      onInspect,
      onRemove,
      onRevert,
      showVersionSelectorPopup,
      hideVersionSelector,
      hideRemoveButton
    } = this.props

    const component = list ? list[index] : null
    if (!component) return null
    const definition = this.getDefinition(component) || { coordinates: component }
    let curation = this.getCuration(component)
    curation = curation || { contributions: [], curations: {} }
    return (
      <div key={key} className="component-row" style={style}>
        <DefinitionEntry
          readOnly={readOnly}
          onClick={() => this.toggleExpanded(component)}
          curation={curation}
          definition={definition}
          component={component}
          onChange={this.onEntryChange}
          otherDefinition={definition.otherDefinition}
          classOnDifference="bg-info"
          renderButtons={() => (
            <ComponentButtons
              definition={definition}
              currentComponent={component}
              hasChange={hasChange}
              readOnly={readOnly}
              onAddComponent={onAddComponent}
              onInspect={onInspect}
              onRevert={onRevert}
              onRemove={onRemove}
              getDefinition={this.getDefinition}
              showVersionSelectorPopup={showVersionSelectorPopup}
              hideVersionSelector={hideVersionSelector}
              hideRemoveButton={hideRemoveButton}
            />
          )}
          onRevert={param => this.revertComponent(component, param)}
        />
      </div>
    )
  }

  render() {
    const { loadMoreRows, noRowsRenderer, list, listLength, sequence, definitions, curations } = this.props
    const { sortOrder, contentSeq: stateSeq } = this.state
    const showFilterBar = false

    // Derive total sequence dynamically to avoid setting state in componentDidUpdate
    const computedContentSeq =
      (get(definitions, 'sequence') || 0) +
      (get(curations, 'sequence') || 0) +
      (sequence || 0) +
      stateSeq

    return (
      <div className={`clearly-table-body flex-grow ${showFilterBar ? 'show-filter' : ''}`}>
        <div className="clearly-header">
          <div className="table-header-fcloumn">
            <h4>Component</h4>
          </div>
          <div className="table-header-cloumn">
            <h4>Score </h4>
            <img src={carrotdownFill} alt="filter" />
          </div>
          <div className="table-header-cloumn">
            <h4>Release Date </h4> <img src={carrotdownFill} alt="filter" />
          </div>
        </div>
        <FormGroup className="flex-grow-column ">
          <RowEntityList
            role="rowgroup1"
            list={list}
            listLength={listLength}
            loadMoreRows={loadMoreRows}
            rowRenderer={this.renderRow}
            rowHeight={this.rowHeight}
            noRowsRenderer={noRowsRenderer}
            sortOrder={sortOrder}
            contentSeq={computedContentSeq}
            customClassName={'components-list'}
          />
        </FormGroup>
      </div>
    )
  }
}

export default withResize(ComponentList)