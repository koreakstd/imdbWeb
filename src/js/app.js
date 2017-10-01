import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import '../styles/styles.scss';

class Home extends Component {
    render() {
        return (<h1>
            Home page
            <p>Hello</p>
        </h1>);
    }
}

// export default Home;
ReactDOM.render(
    <Home />,
    document.getElementById('app')
);
