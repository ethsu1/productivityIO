import React from 'react';
import LoginPage from './login.js';
import Dashboard from './dashboard.js';
import 'bootstrap/dist/css/bootstrap.css';
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import history from './history';

class App extends React.Component{
    render(){
    	console.log(history)
        return(
        	<Router history={history}>
        		<Switch>
	            	<Route exact path="/" component={LoginPage}/>
	            	<Route path="/dashboard" component={Dashboard}/>
	            </Switch>
            </Router>
        )
    }
}
export default App;