// Copyright (c) Microsoft Corporation. All rights reserved.
// SPDX-License-Identifier: MIT

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Grid, Row, Col, Jumbotron } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { ROUTE_ROOT } from '../utils/routingConstants'
import { uiNavigation } from '../actions/ui'

const described = 'vcard'
const secure = 'lock'
const licensed = 'file-code-o'
const use = 'sign-out'
const contribute = 'sign-in'
const adopt = 'toggle-on'

class Landing extends Component {

  componentDidMount() {
    this.props.dispatch(uiNavigation({ to: ROUTE_ROOT }))
  }

  renderNeighborhood(name) {
    return (
      <div className="neighborhood-icon">
        <FontAwesome name={name} />
      </div>
    )
  }

  render() {
    return (
      <Grid className="main-container">
        <Jumbotron>
          <h1>ClearlyDefined</h1>
          <p>&nbsp;</p>
          <p> Enabling free and open source project success by simplifying consumption. </p>
          <p>Are you ClearlyDefined?</p>
        </Jumbotron>


        <Row className="show-grid neighborhood-row">
          <Col md={4} className="valign-child">
            {this.renderNeighborhood(described)}
          </Col>
          <Col md={8}>
            <h2>ClearlyDescribed</h2>
            <h3>
              This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
              This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
              This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
            </h3>
          </Col>
        </Row>
        <Row className="show-grid neighborhood-row">
          <Col md={4} className="valign-child">
            {this.renderNeighborhood(licensed)}
          </Col>
          <Col md={8}>
            <h2>ClearlyLicensed</h2>
            <h3>
              This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
            This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
            This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
            </h3>
          </Col>
        </Row>
        <Row className="show-grid neighborhood-row">
          <Col md={4} className="valign-child">
            {this.renderNeighborhood(secure)}
          </Col>
          <Col md={8}>
            <h2>ClearlySecure</h2>
            <h3>
              This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
              This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
            This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
            </h3>
          </Col>
        </Row>
        <Row className="show-grid neighborhood-row">
          <Col md={8}>
            <h2>Get ClearlyDefined</h2>
            <h3>
              This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
              This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
            This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
            </h3>
          </Col>
          <Col md={4} className="valign-child">
            {this.renderNeighborhood(adopt)}
          </Col>
        </Row>
        <Row className="show-grid neighborhood-row">
          <Col md={8}>
            <h2>Use definitions</h2>
            <h3>
              This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
              This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
            This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
            </h3>
          </Col>
          <Col md={4} className="valign-child">
            {this.renderNeighborhood(use)}
          </Col>
        </Row>
        <Row className="show-grid neighborhood-row">
          <Col md={8}>
            <h2>Contribute or curate data</h2>
            <h3>
              This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
              This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
            This is a bunch of text about this topic. This is a bunch of text about this topic. This is a bunch of text about this topic.
            </h3>
          </Col>
          <Col md={4} className="valign-child">
            {this.renderNeighborhood(contribute)}
          </Col>
        </Row>
      </Grid>
    )
  }
}

function mapStateToProps(state, ownProps) {
  return { token: state.session.token }
}
export default connect(mapStateToProps)(Landing)