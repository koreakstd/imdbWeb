import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import '../styles/main.scss';

class Home extends Component {
    render() {
        return (<h1>
            Home page
            <p>Testing</p>
        </h1>);
    }
}

// export default Home;
ReactDOM.render(
    <Home />,
    document.getElementById('app')
);
