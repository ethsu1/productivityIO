import React from 'react';
import ReactDOM from 'react-dom';
import App from './app.js';

/*only top level needs ReactDOM.render*/
ReactDOM.hydrate(<App />, document.getElementById('app'))
