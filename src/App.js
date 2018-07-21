  /* global google */
import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import './App.css';
import Heading from './components/Heading';
import Footer from './components/Footer';
import MenuContainer from './components/MenuContainer';
import defaultMarker from './icons/defaultMarker.png';
import hoverMarker from './icons/hoverMarker.png';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      visible: false, //state of side nav-bar
      mylocations: require("./data/places.json"), // Gets the data from the places.JSON file
      markers: [], //Markers array on the map
      map: {},
      infowindow: '',
      data: [] //data array from wikipedia
    };
    this.toggleNavMenu = this.toggleNavMenu.bind(this);
    this.markerSelect = this.markerSelect.bind(this);
  }

  //makes sidebar menu visible & invisible
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
    //initializes the map and gets the data from wikipedia
    this.initMap();
    this.getDataWiki();
  }

  getDataWiki() {
    let newData = [];
    this.state.mylocations.map((location) => {
      return fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&prop=extracts&titles&format=json&origin=*&srlimit=1&srsearch=${location.name}`, {
          headers: {
            'Origin': 'http://localhost:3000/',
            'Content-Type': 'application/json; charset=utf-8'
          }
        })
      .then(response => response.json())
      .then(data => {
        let url = encodeURI(`https://en.wikipedia.org/wiki/${data.query.search['0'].title}`);
        let element = {
          text: data.query.search['0'].snippet,
          id: location.id,
          url: url
        };
        newData.push(element);
        this.setState({data: newData});
  		})
      .catch(() => console.log('An error occured'))
    })
  }

  initMap() {
    // Once the Google Maps API has finished loading, initializes the map
    let map;
    this.getGoogleMaps().then((google) => {
      map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: {lat: 54.5260, lng: 15.2551},
        styles: [
              {elementType: 'labels.text.fill', stylers: [{color: '#523735'}]},
              {elementType: 'labels.text.stroke', stylers: [{color: '#f5f1e6'}]},
              {
                featureType: 'water',
                elementType: 'geometry.fill',
                stylers: [{color: '#028090'}]
              },
              {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{color: '#B2DBBF'}]
              }
            ],
        mapTypeControl: false,
        scrollwheel: false
      });
      var infowindow = new google.maps.InfoWindow({maxWidth: 300});
      this.setState({ map: map, infowindow: infowindow });
      this.generateMarkers(map);
    });
  }

  //loops over mylocations and generates markers on the map
  generateMarkers(map) {
    let self = this;
    let bounds = new google.maps.LatLngBounds();
    let markers = [];

    //loops over the places and adds markers
    this.state.mylocations.forEach((item) => {
      let position = item.latlng;
      let title = item.name + ', ' +item.neighborhood;
      let markerID = item.id;
      let markerImage = item.imgSm;
      let alt = item.alt;

      let marker = new google.maps.Marker({
        map: map,
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        icon: defaultMarker,
        id: markerID,
        image: markerImage,
        alt: alt
      });

      //Push marker to the array of markers
      markers.push(marker);

      //Opens infowindow on click
      marker.addListener('click', function() {
        self.markerSelect(marker);
      });
      //Changes the marker icon on hover
      marker.addListener('mouseover', function() {
        this.setIcon(hoverMarker);
      });
      marker.addListener('mouseout', function() {
        this.setIcon(defaultMarker);
      });

      //bounds map to the markers' position
      bounds.extend(marker.position);
    });
    map.fitBounds(bounds);

    this.setState({ markers: markers });
  }

  //opens infowindow and passes information
    markerSelect(marker) {
      this.state.infowindow.open(this.state.map, marker);
      this.state.data.filter((item) => {
        if(item.id === marker.id) {
          this.state.infowindow.setContent(`<div class=marker>
            <h1 class="pacifico center">${marker.title} </h1>
            <img class="marker-image" src=${marker.image} alt=${marker.alt}/>
            <div>
              <p>${item.text}...</p>
              <a rel="noopener noreferrer" href=${item.url} target="_blank">Read more</a>
            </div>
          </div>`);
        }
      })
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
              markers={this.state.markers}
              infowindow={this.state.infowindow}
              onMouseDown={this.toggleNavMenu}
              visible={this.state.visible}
              markerSelect={this.markerSelect}
            />
            <div id="main-view" className={sliding}>
              <Heading />
              <nav className={hiding}>
                <svg
                  className={hiding}
                  tabIndex={tabindex}
                  onClick={this.toggleNavMenu}
                  onKeyDown={this.toggleNavMenu}
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
              <div id="map" tabIndex="-1" aria-label="Map of national parks" role="presentation"></div>
              <Footer />
            </div>
          </div>
        )}/>
      </div>
    );
  }
}

export default App;
