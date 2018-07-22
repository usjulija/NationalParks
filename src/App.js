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
      data: [], //data array from wikipedia
      request: false
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
          this.setState({request: true});
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
    let failedData = [];
    this.state.mylocations.map((location) => {
      return fetch(`https://en.wikipedia.org/w/api.php?&action=query&list=search&prop=extracts&titles&format=json&origin=*&srlimit=1&srsearch=${location.name}`, {
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
          url: url,
          readMore: 'Read more'
        };
        newData.push(element);
        this.setState({data: newData});
  		})
      .catch(() => {
        console.log('An error occured')
        let element = {
          id: location.id,
          text: "Sorry, it wasn't possible to get any data from Wikipedia, please, try later",
          readMore: "☹"
        }
        failedData.push(element);
        this.setState({data: failedData});
      })
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
              <a rel="noopener noreferrer" href=${item.url} target="_blank">${item.readMore}</a>
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
      this.state.request === true ?
      (
        <div className="App">
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
      </div>
    ) : (
      <div className="App">
        <Heading />
        <nav className='hidden'></nav>
        <div id="alternative-content" className="fadeIn">
          <h1 className="pacifico">No content loaded</h1>
          <p>Sorry, we were not able to load the map for you</p>
          <p>Enjoy this little cat and try later</p>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 431 456.2">
            <pattern id="a" width="800" height="800" x="43" y="350" overflow="visible" patternUnits="userSpaceOnUse" viewBox="0 -800 800 800">
              <path fill="none" d="M0-800h800V0H0z"/>
              <path fill="#454F56" d="M0-800h800V0H0z"/>
            </pattern>
            <path fill="#EF9A9B" d="M335.8 115.7s-40.3-28.9-82.2-18.4c0 0-5.1-30.1 11.6-48.6 0 0 72-10.6 93.4 38.4 0 0-12.3-3.1-29.2 1.5 0 0 9.2 13 6.4 27.1zM54 95.1s44.7-25.8 89.2-7.7c0 0 8.6-28-3.1-50.7 0 0-75.7-27.2-106.8 23.4 0 0 14.1-1.5 31.9 6.2.1-.1-12 12.8-11.2 28.8z"/>
            <path fill="#81AE9F" d="M35.1 307.1s42.4 37.5 62.4 121.1l8.5-.3s-28.1-93.6-70.9-120.8z"/>
            <path fill="#FFFAEF" d="M302.4 415s54.4 10.7 53.1-42.1c-1.3-52.7-28.4-121.9 11-132 39.4-10.1 66.9 33.4 55.4 47.4-11.5 14-37-25.7-52.8-16.1-15.8 9.6 63.5 176.1-73.8 166.3 0 0 4.2-7.3 7.1-23.5z"/>
            <path fill="#81AE9F" d="M71.6 255.6s32.2 46.6 31.4 132.5l8.4 1.7c0 .1-4.8-97.6-39.8-134.2z"/>
            <path fill="#FFFAEF" d="M85.5 265.3s20.4-5.8 21.7 0c1.2 5.8-19.7 4.2-20.8 4.2-1.1 0 19.6 5.6 17.4 10.6-2.1 5-21.2-6.9-21.2-6.9s5.9 20 .4 20.3c-5.4.3-5-18.5-5-18.5s-11 18-14.8 13c-3-4 11.1-17.3 11.1-17.3s-16.5 3.6-18.8-2.8c-2.3-6.4 18.2-3.1 18.2-3.1s-15-10-12.5-14.5c4.6-8 14.6 11.1 14.6 11.1S73 243.2 78 242.1c6.4-1.4 3.7 20.1 3.7 20.1s9.3-17.9 15.6-15.5c9 3.5-11.8 18.6-11.8 18.6z"/>
            <circle cx="79.5" cy="267.7" r="4.1" fill="#DB9C32"/>
            <path fill="#FFFAEF" d="M37.8 302.8s-10.4-26-3-28.4c7.4-2.4 8.2 25.3 8.4 26.7.1 1.4 4.7-26.5 11.5-24.4 6.8 2.1-6 28.8-6 28.8s25.4-10.6 26.6-3.4c1.1 7-23.6 9.1-23.6 9.1s25.3 12 19.2 17.6c-4.8 4.5-24.2-12.2-24.2-12.2s7.1 21.1-1.1 25c-8.1 3.9-6.6-23.4-6.6-23.4s-11.1 21.1-17.2 18.4c-11.2-4.9 12.6-20.7 12.6-20.7s-23.7 6.4-25.9 0c-2.8-8.2 25.8-7.6 25.8-7.6s-25-9.7-22.7-18.3c3.4-12.4 26.2 12.8 26.2 12.8z"/>
            <ellipse cx="41.7" cy="310.4" fill="#DB9C32" rx="5.4" ry="5.4" transform="rotate(-6.066 41.79314113 310.35827753)"/>
            <path fill="#81AE9F" d="M300.5 261.3s-24.7 35.8-24.1 101.8l-6.4 1.3s3.6-75 30.5-103.1zM325.6 312.9s-32.6 28.8-47.9 93l-6.6-.2s21.6-71.9 54.5-92.8z"/>
            <path fill="#FFFAEF" d="M289.8 268.7s-15.7-4.4-16.6 0c-.9 4.4 15.1 3.2 16 3.2.8 0-15 4.3-13.4 8.1 1.6 3.8 16.3-5.3 16.3-5.3s-4.6 15.4-.3 15.6c4.1.2 3.8-14.2 3.8-14.2s8.5 13.9 11.4 10c2.3-3.1-8.6-13.3-8.6-13.3s12.7 2.8 14.4-2.2c1.8-4.9-14-2.4-14-2.4s11.5-7.7 9.6-11.1c-3.5-6.2-11.2 8.6-11.2 8.6s2.2-14.1-1.6-15c-4.9-1.1-2.8 15.4-2.8 15.4s-7.1-13.8-12-11.9c-7 2.9 9 14.5 9 14.5z"/>
            <circle cx="294.5" cy="270.5" r="3.1" fill="#DB9C32"/>
            <path fill="#FFFAEF" d="M323.6 309.6s8-20 2.3-21.8c-5.7-1.8-6.3 19.4-6.4 20.5-.1 1.1-3.6-20.3-8.8-18.7-5.2 1.6 4.6 22.1 4.6 22.1s-19.5-8.1-20.4-2.6c-.9 5.4 18.1 7 18.1 7s-19.4 9.2-14.8 13.5c3.7 3.4 18.6-9.4 18.6-9.4s-5.4 16.2.8 19.2 5.1-18 5.1-18 8.5 16.2 13.2 14.1c8.6-3.7-9.7-15.9-9.7-15.9s18.2 4.9 19.9 0c2.1-6.3-19.8-5.8-19.8-5.8s19.1-7.4 17.3-14c-2.5-9.6-20 9.8-20 9.8z"/>
            <ellipse cx="320.5" cy="315.4" fill="#DB9C32" rx="4.1" ry="4.1" transform="rotate(-83.921 320.5369831 315.41966672)"/>
            <path fill="#FFFAEF" d="M237 134.5s67.6-86.2 82.4-64.3C334.2 92.1 298 177.8 298 177.8s-24.3-28.5-61-43.3z"/>
            <path fill="#D99779" d="M257.2 132.2s43.2-52.7 48.6-48.9c5.4 3.7-11.4 75.7-11.4 75.7s-20.2-21-37.2-26.8z"/>
            <path fill="#FFFAEF" d="M48.7 209.4s50.6-87.7 149.3-87.7c98.7 0 139.9 90.6 139.9 90.6s-145.5 121.6-289.2-2.9z"/>
            <path fill="#FFFAEF" d="M277.7 352.2c-11-58.4-53.3-89.7-53.3-89.7-22.1-10-49.3 2.4-49.3 2.4-61.9 76.7-55.2 173.7-55.2 173.7h171.5c29.1-70.9-3.1-87.7-13.7-86.4z"/>
            <path fill="#FFFAEF" d="M128.7 344.3s-17.8 40.2-12.6 94.4h-41s-55.3-81.4-30.7-77.6c27.6 4.2 43.9 57.2 43.9 57.2s-18.7-85.4 40.4-74zM155.2 139.9S87.6 53.7 72.8 75.6C58.1 97.5 94.2 183.2 94.2 183.2s24.3-28.5 61-43.3z"/>
            <path fill="url(#a)" d="M200.3 223.3l-.4 12.7-2.3.2-1.1-12c.1.1.7-1.7 3.8-.9z"/>
            <path fill="#EF9A9B" d="M185.7 218.5s12.7-8.5 25.5 0c0 0-10.3 8.2-12.7 8.2-2.5 0-12.8-8.2-12.8-8.2z"/>
            <circle cx="273.3" cy="221.7" r="24.2" fill="#F0AFB6"/>
            <circle cx="113.8" cy="221.7" r="24.2" fill="#F0AFB6"/>
            <path fill="url(#a)" d="M166.1 199.4c0 11.7-5.7 17.6-12.7 17.6-7 0-12.7-5.9-12.7-17.6 0-11.7 5.7-21.2 12.7-21.2 7 0 12.7 9.5 12.7 21.2zM252.2 197.9c0 11.7-5.7 17.6-12.7 17.6-7 0-12.7-5.9-12.7-17.6 0-11.7 5.7-21.2 12.7-21.2 7 0 12.7 9.5 12.7 21.2z"/>
            <path fill="#E9C6B0" d="M158.7 162.6s-10.7-4-19.3 8.6c0 0 1.9-20 19.3-8.6zM243.9 162.6s10.7-4 19.3 8.6c0 0-1.9-20-19.3-8.6z"/>
            <path fill="url(#a)" d="M175.9 217.7s-.8 18.1 22.1 19.6c22.9 1.5 23.5-21.4 23.5-21.4s-4.8 20.4-23.4 19.2c-18.6-1.2-22.2-17.4-22.2-17.4z"/>
            <path fill="#E9C6B0" d="M242.9 127.2s-28.1 64.6-44.5 64.6C182 191.9 147 130 147 130s49.2-20.5 95.9-2.8z"/>
            <path fill="#707173" d="M122.9 240.6l-.4-.5c18.6-14.2 43.6-13.3 43.9-13.3v.6c-.2 0-25-.9-43.5 13.2zM126.9 255.4l-.5-.3c14.6-19.5 38.9-26.6 39.1-26.7l.2.6c-.2.1-24.3 7.1-38.8 26.4zM121 230.4l-.3-.5c19.9-11.5 44.7-7.3 44.9-7.2l-.1.6c-.2 0-24.8-4.3-44.5 7.1zM270.3 240.6c-18.4-14-43.3-13.2-43.5-13.2v-.6c.3 0 25.3-.9 43.9 13.3l-.4.5zM266.3 255.4c-14.5-19.4-38.6-26.4-38.8-26.5l.2-.6c.2.1 24.5 7.2 39.1 26.7l-.5.4zM272.2 230.4c-19.7-11.4-44.3-7.2-44.5-7.1l-.1-.6c.2 0 25-4.3 44.9 7.2l-.3.5z"/>
            <path fill="#E9C6B0" d="M88.1 164.1s15.4 20.1 15.6 23.7c.2 3.6-31.6-8.5-31.6-8.5s10.1-10.1 16-15.2zM69.3 182.5s15.4 20.1 15.6 23.7c.2 3.6-29.6-6.8-29.6-6.8s8.1-11.8 14-16.9zM300.6 162.2s-15.6 22-15.8 25.6c-.2 3.6 31.6-8.5 31.6-8.5s-10-12-15.8-17.1zM348.1 258.1s18.3 7.7 21.8 6.8c3.5-.8-8.1-22.4-8.1-22.4s-10.1 3.4-13.7 15.6zM345.5 288.4s14-8.3 16.8-10.5c2.8-2.2-16.4-10.5-16.4-10.5s-1.5 10.5-.4 21zM371.8 239.9s9.3 22.4 12.2 24.4c2.9 2.1 10.7-21.7 10.7-21.7s-15.5-5.1-22.9-2.7zM319.2 182.5s-15.4 20.1-15.6 23.7c-.2 3.6 27.8-5.9 27.8-5.9s-6.2-10.5-12.2-17.8z"/>
            <path fill="#D99779" d="M132.8 134.4S94.7 90.1 84.5 90.1c-10.2 0 7.4 70 7.4 70s30.7-22.6 40.9-25.7z"/>
            <path fill="#ADD4C9" d="M278.8 349.2c42.6 1.3-7.7 100.1-35.2 106.7-27.4 6.7-7.4-108 35.2-106.7z"/>
            <path fill="#FFFAEF" d="M277.8 355.2c37.2 2.2-9.1 90.6-33.2 95.9-24.2 5.4-4-98.1 33.2-95.9z"/>
            <path fill="#E9C6B0" d="M265.3 389.9c20.3 1.1-4.9 44.3-18.1 47-13.1 2.6-2.1-48.1 18.1-47zM262.9 365.7c7.7.4-1.9 17.4-6.8 18.5-5.1 1-.9-19 6.8-18.5z"/>
            <path fill="#E9C6B0" d="M274.9 365.2c7.7.4-1.9 17.4-6.8 18.5-5.1 1.1-.9-18.9 6.8-18.5zM285.8 373.1c7.5 1.6-4.5 16.9-9.5 17.2-5.1.2 2-18.8 9.5-17.2z"/>
            <circle cx="157.7" cy="188" r="4.3" fill="#FFFAEF"/>
            <circle cx="243.9" cy="188" r="4.3" fill="#FFFAEF"/>
            <path fill="#FFFAEF" d="M202.8 157.1s-2.2 10.3 0 10.8 1.5-13.3 0-10.8zM192 158.6s-1.2 10.5 1 10.7c2.3.3.4-13.4-1-10.7zM193.8 140.5s-2.2 10.3 0 10.8c2.2.4 1.6-13.4 0-10.8zM182.5 167.9s.9 10.5 3.2 10.3c2.2-.2-2.4-13.2-3.2-10.3zM182.9 149s-1.1 10.5 1.2 10.7c2.2.2.1-13.4-1.2-10.7zM173 153.9s-1.1 10.5 1.2 10.7c2.2.2.1-13.4-1.2-10.7zM178.7 133.3s-1.2 10.5 1 10.7c2.3.3.4-13.4-1-10.7zM170.2 126.7s-.6 10.5 1.7 10.7c2.3.1-.5-13.4-1.7-10.7zM204 137.6s-2.2 10.3 0 10.8c2.2.4 1.5-13.4 0-10.8zM208.5 123.9s-2.2 10.3 0 10.8c2.2.4 1.5-13.4 0-10.8zM157.6 129.5s-.4 10.5 1.9 10.6c2.2.1-.8-13.4-1.9-10.6zM198.5 122.4s-2.2 10.3 0 10.8 1.5-13.3 0-10.8zM198.2 174.4s-2.2 10.3 0 10.8 1.6-13.3 0-10.8zM166.2 140.2s.2 10.5 2.5 10.5c2.3-.1-1.5-13.3-2.5-10.5zM211.3 168.5s-.9 10.5-3.2 10.3c-2.2-.2 2.4-13.2 3.2-10.3zM220.8 153.9s1.1 10.5-1.2 10.7c-2.2.2-.1-13.4 1.2-10.7zM215.6 133.3s1.2 10.5-1 10.7c-2.2.3-.3-13.4 1-10.7zM212 150.1s1.2 10.5-1 10.7c-2.2.3-.3-13.4 1-10.7zM224.2 126.7s.6 10.5-1.7 10.7c-2.3.1.5-13.4 1.7-10.7zM236.2 129.5s.4 10.5-1.9 10.6c-2.2.1.8-13.4 1.9-10.6zM227.6 140.2s-.2 10.5-2.5 10.5c-2.3-.1 1.5-13.3 2.5-10.5zM186.1 124.7s-2.2 10.3 0 10.8 1.6-13.3 0-10.8z"/>
            <path fill="#E9C6B0" d="M158.2 438.7s8-80.1 30-90c38.8-17.5 38.2 90 38.2 90h-68.2z"/>
            <path fill="#FFFAEF" d="M204.8 364.3s-2.2 10.3 0 10.8c2.2.4 1.5-13.4 0-10.8zM181.6 364.8s-2.2 10.3 0 10.8 1.6-13.3 0-10.8zM195.8 380.6s-1.2 10.5 1 10.7c2.3.3.4-13.3-1-10.7zM194.9 358.7s-2.2 10.3 0 10.8c2.3.5 1.6-13.3 0-10.8zM190.6 404.2s-2.2 10.3 0 10.8 1.6-13.3 0-10.8zM179.3 402.8s-1.2 10.5 1 10.7c2.2.3.3-13.4-1-10.7zM184 382.9s-2.2 10.3 0 10.8 1.6-13.3 0-10.8zM179.8 424.3s-2.2 10.3 0 10.8 1.6-13.3 0-10.8zM167.3 420.9s-1.2 10.5 1 10.7c2.3.3.4-13.4-1-10.7zM172.4 391s-2 10.4.2 10.8c2.2.5 1.3-13.3-.2-10.8zM206 420.9s-2.2 10.3 0 10.8c2.2.4 1.6-13.4 0-10.8zM194.1 422.3s-1.2 10.5 1 10.7c2.2.3.3-13.3-1-10.7zM202.2 398.7s-2.2 10.3 0 10.8c2.2.4 1.6-13.4 0-10.8zM218.7 418.8s-2.2 10.3 0 10.8c2.3.5 1.6-13.3 0-10.8zM214.1 398.7s-1.2 10.5 1 10.7c2.3.3.3-13.4-1-10.7zM211.3 380.6s-2.2 10.3 0 10.8 1.5-13.3 0-10.8z"/>
            <circle cx="195" cy="292.2" r="48.1" fill="#F0AFB6"/>
            <path fill="#F58981" d="M147.9 288.1c-.2 0-.4-.1-.5-.2-.4-.3-.5-.8-.2-1.2.1-.1 7.2-9.6 20.2-18.4 12-8.1 31.5-17.4 56.6-15.4.5 0 .8.5.8.9 0 .5-.5.8-.9.8-24.5-2-43.7 7.1-55.4 15.1-12.7 8.7-19.7 17.9-19.8 18-.3.3-.5.4-.8.4z"/>
            <path fill="#F58981" d="M147.9 303c-.2 0-.3 0-.5-.1-.4-.3-.5-.8-.3-1.2.2-.4 6.3-9.9 19.7-19.8 12.4-9.1 33.7-20.3 64.8-21.6.5 0 .9.4.9.8 0 .5-.4.9-.8.9-30.6 1.3-51.5 12.2-63.7 21.2-13.2 9.7-19.3 19.3-19.4 19.4-.1.3-.4.4-.7.4z"/>
            <path fill="#F58981" d="M207.4 339.6c-.4 0-.7-.2-.8-.6-12.5-39.6-6.3-72.7-6.2-73 .1-.5.6-.8 1-.7.5.1.8.6.7 1-.1.3-6.1 33 6.2 72.2.1.5-.1 1-.6 1.1h-.3zM187.1 340.5c-.3 0-.6-.2-.8-.4-13.3-22-12.8-61.8-12.8-62.2 0-.5.4-.9.9-.9s.9.4.9.9c0 .4-.5 39.7 12.6 61.3.3.4.1 1-.3 1.2-.2.1-.4.1-.5.1zM156.9 263.7c-.3 0-.6-.1-.7-.4-.3-.4-.2-.9.3-1.2.3-.2 26.6-17.3 52.4-16.8.5 0 .9.4.9.9s-.4.9-.9.9c-25.2-.5-51.1 16.3-51.4 16.5-.2 0-.4.1-.6.1zM179.9 338.8c-.2 0-.4-.1-.5-.2-23.7-16.8-18.7-51.2-18.7-51.5.1-.5.5-.8 1-.7.5.1.8.5.7 1-.1.3-4.8 33.6 18 49.8.4.3.5.8.2 1.2-.1.3-.4.4-.7.4z"/>
            <path fill="#F58981" d="M199.8 280.8c-.3 0-.6-.1-.7-.4-.3-.4-.1-1 .3-1.2.6-.4 14.9-8.9 41.5-2.9.5.1.8.6.7 1-.1.5-.6.8-1 .7-25.9-5.9-40.1 2.6-40.2 2.6-.3.2-.5.2-.6.2zM242.9 296.4c-.1 0-.2 0-.3-.1-18.6-7.8-41.8-1.1-42.1-1-.5.1-1-.1-1.1-.6-.1-.5.1-1 .6-1.1 1-.3 24-7 43.2 1.1.4.2.7.7.5 1.1-.1.4-.4.6-.8.6z"/>
            <path fill="#F58981" d="M202.3 318.6c-.3 0-.6-.1-.7-.4-.3-.4-.2-.9.2-1.2.1-.1 12.9-8.9 17.6-25 .1-.5.6-.7 1.1-.6.5.1.7.6.6 1.1-4.9 16.7-17.8 25.6-18.3 25.9-.2.1-.4.2-.5.2zM207.4 337c-.3 0-.6-.2-.8-.4-.2-.4-.1-1 .3-1.2 25.4-15.3 26.2-41.8 26.2-42.1 0-.5.4-.9.9-.9s.9.4.9.9c0 .3-.8 27.7-27 43.5-.2.2-.3.2-.5.2zM196.4 341.2c-.4 0-.7-.2-.8-.6-15.9-48.3-6.9-69.9-6.5-70.8.2-.4.7-.6 1.2-.5.4.2.6.7.5 1.2-.1.2-9 22 6.6 69.6.2.5-.1 1-.6 1.1h-.4z"/>
            <g>
              <path fill="#FFFAEF" d="M139.9 351s15.8 4.4 32.5-3.4c16.8-7.8 15.1-52.2 1-58-14-5.8-6.1 31.8-26.8 33.3.1 0 1.6 17.8-6.7 28.1z"/>
              <path fill="#ADD4C9" d="M146.7 322.9s8.4-1.9 12.6-13.8c4.2-11.9 4.2-22 13.4-21.3 9.2.7 31.2 59.1-19 71.1 0 0 24.7-9.7 27.2-25.9s-1.8-38.8-10.9-40.1c-9.2-1.3-3.5 30.8-23.3 30z"/>
              <path fill="#ADD4C9" d="M175 293.1s-4.7 4.9-5.3 12.9c0 0-5.8-8.2 5.3-12.9zM179.9 299s-4.7 4.9-5.3 12.9c.1-.1-5.8-8.3 5.3-12.9z"/>
            </g>
            <g>
              <path fill="#FFFAEF" d="M265.7 337.7s-13.6 8.8-31.6 4.8c-18-4-26.8-48.8-14.3-57.5 12.4-8.7 13.6 29.7 34.2 26.8-.1-.1 1.3 17.6 11.7 25.9z"/>
              <path fill="#ADD4C9" d="M253 311.8s-8.6-.1-15.3-10.8c-6.7-10.7-8.9-20.6-17.7-17.9-8.8 2.7-17.7 64.5 33.8 65.3 0 0-26.2-4.2-32.1-19.4-6-15.2-6.6-38.2 2-41.5 8.8-3.3 10.2 29.3 29.3 24.3z"/>
              <path fill="#ADD4C9" d="M219 288.7s5.6 3.8 7.9 11.4c0 .1 3.9-9.2-7.9-11.4zM215.4 295.5s5.6 3.8 7.9 11.4c0 0 3.9-9.2-7.9-11.4z"/>
            </g>
            <path fill="#D15758" d="M253.3 75.4s38.1-5.8 59.7 4.4c0 0-39.7 1.8-59.9 17.8 0 0-.7-12.2.2-22.2z"/>
            <path fill="#F0AFB6" d="M108.2 40.8s38.1 14.7 102-2 74.1-17.8 89.3-10.3c0 0 14 33.1 14.2 51.4 0 0-44.5-2.4-90.8 12.5S120 109.4 94.8 87c0-.1-11.4-31.2 13.4-46.2z"/>
            <path fill="none" d="M106 78.5s26.8 7 58.1 6.6c45.3-.6 64.6-8.5 117.9-26.2"/>
            <text transform="rotate(7.778 -541.6741429 938.19439848)">
              <tspan x="0" y="0" fill="#FFFAEF" fontFamily="'Calvin'" fontSize="19">K</tspan><tspan x="15.6" y="0" fill="#FFFAEF" fontFamily="'Calvin'" fontSize="19" rotate="-3.4">E</tspan><tspan x="29.8" y="-.9" fill="#FFFAEF" fontFamily="'Calvin'" fontSize="19" rotate="-6.9">E</tspan><tspan x="43.5" y="-2.6" fill="#FFFAEF" fontFamily="'Calvin'" fontSize="19" rotate="-9.8">P</tspan><tspan x="56.2" y="-4.8" fill="#FFFAEF" fontFamily="'Calvin'" fontSize="19" rotate="-11.6"> </tspan><tspan x="61.7" y="-6" fill="#FFFAEF" fontFamily="'Calvin'" fontSize="19" rotate="-12.8"> </tspan><tspan x="67.3" y="-7.2" fill="#FFFAEF" fontFamily="'Calvin'" fontSize="19" rotate="-14.3"> </tspan><tspan x="73" y="-8.6" fill="#FFFAEF" fontFamily="'Calvin'" fontSize="19" rotate="-16.9">S</tspan><tspan x="86.1" y="-12.6" fill="#FFFAEF" fontFamily="'Calvin'" fontSize="19" rotate="-20.8">M</tspan><tspan x="100.6" y="-18.2" fill="#FFFAEF" fontFamily="'Calvin'" fontSize="19" rotate="-23.1">I</tspan><tspan x="104.9" y="-20" fill="#FFFAEF" fontFamily="'Calvin'" fontSize="19" rotate="-24.3">L</tspan><tspan x="114.2" y="-24.3" fill="#FFFAEF" fontFamily="'Calvin'" fontSize="19" rotate="-25.1">I</tspan><tspan x="118.5" y="-26.2" fill="#FFFAEF" fontFamily="'Calvin'" fontSize="19" rotate="-25.8">N</tspan><tspan x="131.7" y="-32.6" fill="#FFFAEF" fontFamily="'Calvin'" fontSize="19" rotate="-26.2">G</tspan>
            </text>
            <path fill="#D15758" d="M106.2 40.5s22.9-1 34.4-4.3c0 0 2.7 6.4 2.7 10.3 0 .1-28.9-2.2-37.1-6z"/>
          </svg>
        </div>
        <Footer />
      </div>
    )
    );
  }
}

export default App;
