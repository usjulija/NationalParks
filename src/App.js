  /* global google */
import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import './App.css';
import Heading from './components/Heading';
import Footer from './components/Footer';
import MenuContainer from './components/MenuContainer';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      mylocations: require("./data/places.json"), // Get the places from the JSON file in data folder
      markers: []
    };
    this.toggleNavMenu = this.toggleNavMenu.bind(this);
  }

  toggleNavMenu() {
    this.setState({
        visible: !this.state.visible
    });
  }

//getGoogleMaps() was provided by tremby at: https://stackoverflow.com/a/48494032
  getGoogleMaps() {
    // Defines the promise
    if (!this.googleMapsPromise) {
      this.googleMapsPromise = new Promise((resolve) => {
        // Adds a global handler for when the API finishes loading
        window.resolveGoogleMapsPromise = () => {
          // Resolves the promise
          resolve(google);

          // Tidy up
          delete window.resolveGoogleMapsPromise;
        };

        // Loads the Google Maps API
        const script = document.createElement("script");
        const API = 'AIzaSyAseJ92xDY6RipMXcHJ4jdP72SZGyM-drE';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API}&callback=resolveGoogleMapsPromise`;
        script.async = true;
        document.body.appendChild(script);
      });
    }

    // Returns a promise for the Google Maps API
    return this.googleMapsPromise;
  }

  componentWillMount() {
    // Start Google Maps API loading since we know we'll soon need it
    this.getGoogleMaps();
  }

  componentDidMount() {
    // Once the Google Maps API has finished loading, initializes the map
    this.getGoogleMaps().then((google) => {
      const uluru = {lat: 54.5260, lng: 15.2551};
      const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: uluru
      });
      this.setState({map:map});

      let markers = [];
      this.state.mylocations.forEach((item) => {
        let position = item.latlng;
        let title = item.name;
        let markerID = item.id;
        var infowindow = new google.maps.InfoWindow({
          content: item.name
        });

        let marker = new google.maps.Marker({
          map: map,
          position: position,
          title: title,
          animation: google.maps.Animation.DROP,
          id: markerID
        });

        // Push the marker to the array of markers.
        markers.push(marker);
        marker.addListener('click', function() {
          infowindow.open(map, marker);
        });
      });
      this.setState({ markers: markers });
      console.log(this.state.markers);
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
              onMouseDown={this.toggleNavMenu}
              visible={this.state.visible}
            />
            <div id="main-view" className={sliding}>
              <Heading />
              <nav className={hiding}>
                <svg
                  className={hiding}
                  tabIndex={tabindex}
                  onClick={this.toggleNavMenu}
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
              <div id="map"></div>
              <Footer />
            </div>
          </div>
        )}/>
      </div>
    );
  }
}

export default App;
