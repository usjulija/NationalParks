import React from 'react';
import { Link } from 'react-router-dom';

const Footer = (props) => {
  return (
    <footer role="contentinfo">
      <p>
        Copyright (c) 2018 <Link to="/">Beautiful European National Parks</Link>
      </p>
      <p>
        designed by
        <a rel="noopener noreferrer" href="http://julia-juls.com/" target="_blank">
          <span className="pacifico">Julia Us</span>
        </a>
      </p>
      <p>
        List of the parks taken from
        <a rel="noopener noreferrer" href="http://www.worldofwanderlust.com/20-of-the-best-national-parks-in-europe/?ved=0ahUKEwjY6b6hzajcAhVDEJoKHd8hBdgQypMCCCIwCw" target="_blank"> World of Wanderlust</a>
      </p>
      <p>
        Visuals designed by
        <a rel="noopener noreferrer" href="https://www.freepik.com/" target="_blank"> Freepic</a>
      </p>
    </footer>
  );
}

export default Footer
