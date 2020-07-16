import React from 'react';
import Paperbase from '../paperbase/Paperbase.js';
import axios from 'axios';
class Dashboard extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isOk: false,
		}
		this.logoutHandler = this.logoutHandler.bind(this);
	}

	logoutHandler(){
		const params = new URLSearchParams();
		var user = window.localStorage.getItem('user');
		params.append('user', user );
		axios.post("https://productivityio.azurewebsites.net/logout", params, {withCredentials: true})
		.then(response => {
			this.props.history.replace("/")
			window.localStorage.removeItem('user');
		})
	}

	async componentDidMount(){
		var user = window.localStorage.getItem('user');
		if(user === null){
			this.props.history.replace("/")
		}
		axios.get("https://productivityio.azurewebsites.net/authorized", {
			params: {
	      		user: user
	    	},
	    	withCredentials: true,
	    })
	    .then(res => {
	    	this.setState({isOk: true})
	    })
	    //prevent direct url without authorization
	    .catch(error => {
	    	this.props.history.replace("/")
	    	this.setState({isOk: false})
	    })
	}
	render() {
		const response = this.state.isOk;
		if(!response){
			return null
		}
		return (<Paperbase logout={this.logoutHandler} history={this.props.history}/>)
	}
}

export default Dashboard;