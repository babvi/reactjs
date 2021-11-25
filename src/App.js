import React, {Component} from 'react';
import './assets/css/style.css';
import Main from './components/MainPage/Main';
class App extends Component {
  render() {
    return (
      <div className="container">
        <div className="dHead main-heading">
          <h2>Messages</h2>
        </div>
        <Main />
      </div>
    );
  }
}

export default App;
