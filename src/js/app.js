import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import style from '../styles/main.scss';

class Home extends Component {
    render() {
        return (<h1 className={style.font_red}>
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
