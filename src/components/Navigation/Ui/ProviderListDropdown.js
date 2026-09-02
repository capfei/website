// Copyright (c) Microsoft Corporation and others. Licensed under the MIT license.
// SPDX-License-Identifier: MIT

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import DropdownButton from 'react-bootstrap/lib/DropdownButton'
import MenuItem from 'react-bootstrap/lib/MenuItem'

export default class ProviderListDropdown extends Component {
  static propTypes = {
    list: PropTypes.array,
    onChange: PropTypes.func,
    activeProvider: PropTypes.string
  }

  static defaultProps = {
    list: [],
    onChange: () => { }
  }

  render() {
    const { list, onChange, activeProvider, ...restProps } = this.props

    return (
      <DropdownButton
        id="provider-list-dropdown"
        title={activeProvider || 'Select Provider'}
        onSelect={onChange}
        {...restProps}
      >
        {(list || []).map((provider, index) => (
          <MenuItem key={provider.id || index} eventKey={provider}>
            {provider.label || provider.name || provider}
          </MenuItem>
        ))}
      </DropdownButton>
    )
  }
}