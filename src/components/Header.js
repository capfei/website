// Copyright (c) Microsoft Corporation and others. Licensed under the MIT license.
// SPDX-License-Identifier: MIT

import React, { Component } from 'react'
import { connect } from 'react-redux'
import logo from '../images/web/logo.svg'
import { logout, login } from '../actions/sessionActions'
import { withRouter } from 'react-router-dom'
import { ROUTE_ROOT } from '../utils/routingConstants'
import { LinkContainer, IndexLinkContainer } from 'react-router-bootstrap'
import { filter, intersection } from 'lodash'
import Auth from '../utils/auth'
import { Menu, Dropdown, Button, Space, Layout } from 'antd'
import { LoginOutlined, LogoutOutlined, MenuOutlined, CloseOutlined } from '@ant-design/icons'

class Header extends Component {
  constructor(props) {
    super(props)
    this.handleLogin = this.handleLogin.bind(this)
    this.doLogout = this.doLogout.bind(this)
    this.checkNav = this.checkNav.bind(this)
    this.state = {
      menuOpen: true
    }
  }

  doLogout(e) {
    e.preventDefault()
    this.props.dispatch(logout())
  }

  handleLogin(e) {
    e.preventDefault()
    Auth.doLogin((token, permissions, username, publicEmails) => {
      this.props.dispatch(login(token, permissions, username, publicEmails))
    })
  }

  gotoDocs() {
    window.open('https://docs.clearlydefined.io', '_blank')
  }

  renderDocs() {
    return (
      <Menu.Item key="docs" onClick={this.gotoDocs}>
        Documentation
      </Menu.Item>
    )
  }

  renderLogin() {
    const { session } = this.props

    if (session?.isAnonymous && !session?.isFetching)
      return (
        <Space>
          <Button 
            type="text" 
            icon={<LoginOutlined />} 
            onClick={this.handleLogin}
          >
            Login
          </Button>
        </Space>
      )
    return (
      <Space>
        <Button 
          type="text" 
          icon={<LogoutOutlined />} 
          onClick={this.doLogout}
        >
          Logout
        </Button>
      </Space>
    )
  }

  renderNavigation(navigation, isAnonymous) {
    const filterExpr = isAnonymous
      ? o => o.protected !== 1
      : o => o.protected !== -1 && this.hasPermissions(o.permissions)
    return filter(navigation, filterExpr).map((navItem, i) => {
      return (
        <IndexLinkContainer active={navItem.isSelected} activeClassName="active" to={navItem.to} key={i}>
          <Menu.Item role="button" onClick={() => (navItem.customUrl ? this.gotoDocs() : null)}>
            {navItem.title}
          </Menu.Item>
        </IndexLinkContainer>
      )
    })
  }

  hasPermissions(permissions) {
    if (!permissions) return true
    return intersection(this.props.session.permissions, permissions).length > 0
  }

  checkNav() {
    let width = window.innerWidth
    if (width > 768) this.setState({ menuOpen: true })
    else this.setState({ menuOpen: false })
  }

  componentDidMount() {
    window.addEventListener('resize', this.checkNav)
    if (window.innerWidth < 768) {
      this.setState({ menuOpen: false })
    }
    return () => {
      window.removeEventListener('resize', this.checkNav)
    }
  }

  render() {
    const { session, navigation } = this.props
    return (
      <Layout>
        <Layout.Header className="clearly-header-nav">
          <div className="clearly-logo">
            <LinkContainer to={ROUTE_ROOT}>
              <a href="#" onClick={e => e.preventDefault()}>
                <img src={logo} alt="ClearlyDefined" />
              </a>
            </LinkContainer>
          </div>
          <div className="clearly-nav-menu">
            <Menu mode="horizontal">
              {this.renderNavigation(navigation, session?.isAnonymous)}
              {this.renderDocs()}
            </Menu>
          </div>
          <div className="clearly-header-actions">
            {this.renderLogin()}
          </div>
        </Layout.Header>
      </Layout>
    )
  }
}

function mapStateToProps(state) {
  return {
    session: state.session,
    navigation: state.navigation.map(navItem => ({
      ...navItem,
      isSelected: state.navigation.findIndex(n => n.title === navItem.title) === state.navigation.indexOf(navItem)
    }))
  }
}

export default withRouter(connect(mapStateToProps)(Header))
