// Copyright (c) Microsoft Corporation and others. Licensed under the MIT license.
// SPDX-License-Identifier: MIT

import React from 'react'
import { Tooltip } from 'antd'

const ButtonWithTooltip = ({ children, tip, placement }) => {
  return (
    <Tooltip placement={placement || 'top'} title={tip}>
      <div className="tooltipWrapper">{children}</div>
    </Tooltip>
  )
}

export default ButtonWithTooltip