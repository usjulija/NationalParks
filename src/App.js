import React, { Component } from 'react';
import './App.css';
import Heading from './components/Heading';
import MenuContainer from './components/MenuContainer';
import { Route } from 'react-router-dom';

class App extends Component {
  state = {
    visible: false
  }

  toggleNavMenu() {
    this.setState({
        visible: !this.state.visible
    });
  }

  render() {
    let sliding = this.state.visible === true ? "slide" : "unslide";
    let hiding = this.state.visible === true ? "hidden" : "";
    let tabindex = this.state.visible === true ? "-1" : "0";

    return (
      <div className="App">
        <Route exact path="/" render={() => (
          <div>
            <MenuContainer
              onMouseDown={this.toggleNavMenu.bind(this)}
              visible={this.state.visible}
            />
            <div id="main-view" className={sliding}>
              <Heading />
              <nav className={hiding}>
                <svg
                  className={hiding}
                  tabIndex={tabindex}
                  onClick={this.toggleNavMenu.bind(this)}
                  role="button"
                  aria-label="open sidebar"
                  alt="menu icon"
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'>
                  <g fill='#f0f3bd'>
                    <path d='M24,3c0-0.6-0.4-1-1-1H1C0.4,2,0,2.4,0,3v2c0,0.6,0.4,1,1,1h22c0.6,0,1-0.4,1-1V3z'/>
                    <path d='M24,11c0-0.6-0.4-1-1-1H1c-0.6,0-1,0.4-1,1v2c0,0.6,0.4,1,1,1h22c0.6,0,1-0.4,1-1V11z'/>
                    <path d='M24,19c0-0.6-0.4-1-1-1H1c-0.6,0-1,0.4-1,1v2c0,0.6,0.4,1,1,1h22c0.6,0,1-0.4,1-1V19z'/>
                  </g>
                </svg>
              </nav>
            </div>
          </div>
        )}/>
      </div>
    );
  }
}

export default App;
