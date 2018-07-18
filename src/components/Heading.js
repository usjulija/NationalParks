import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../icons/logo.png'

const Heading = (props) => {
  return (
    <header role="banner" aria-label="main-heading">
      <Link to="/" aria-label="Best European National parks main page logo" tabIndex="1">
        <img src={Logo} height="60" alt="logo with trees" />
      </Link>
      <h1 className="pacifico">Beautiful</h1>
      <h2> European National Parks</h2>
    </header>
  );
}

export default Heading
