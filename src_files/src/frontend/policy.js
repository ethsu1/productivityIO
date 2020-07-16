import React from 'react';
import AddPolicy from './addpolicy.js';
import PolicyList from './policylist.js';
import axios from 'axios';

class Policy extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			urls: []
		}

		this.onClickHandler = this.onClickHandler.bind(this);
		this.onDeleteHandler = this.onDeleteHandler.bind(this);

	}

	componentDidMount(){
		var value = window.localStorage.getItem('user');
		axios.get("https://productivityio.azurewebsites.net/policy",{
			params: {
	      		user: value
	    	},
	    	withCredentials: true,
	    })
		.then((res) => {
			this.setState({urls: res.data})
		})
		.catch((res) => {
			this.props.history.replace("/")
			window.localStorage.removeItem('user');
			alert("Your session has expired. Please log back in.")
		})

	}

	onClickHandler(event, url){
		event.preventDefault();
		//regex handling of .com or .org
		var re = '[a-z0-9]*.(com|org|net)$'
		var result = url.match(re);
		if(result !== null){
			if(url.length > 0){
				var arr = this.state.urls;
				var user = window.localStorage.getItem('user');
				const params = new URLSearchParams();
				params.append('user', user );
				params.append('policy', url);
				axios.post("https://productivityio.azurewebsites.net/policy",params, {withCredentials: true})
				.then((res) => {
					//http status code of created
					if(res.status === 201){
						arr.push(url)
						this.setState({urls: arr})
					}
				})
				.catch((error) => {
					//conflict
					if(error.response.status == 409){
						alert("The url you inputted already exists in your policies")
					}
					//session timount
					else{
						this.props.history.replace("/")
						window.localStorage.removeItem('user');
						alert("Your session has expired. Please log back in.")
					}
				})
			}
		}
		else{
			alert("The url syntax is incorrect. Please follow the syntax of the description.")
		}
	}

	onDeleteHandler(event, url){
		event.preventDefault();
		var arr = this.state.urls;
		var user = window.localStorage.getItem('user');
		var payload = {
			"user": user,
			"policy": url
		}
		axios.delete("https://productivityio.azurewebsites.net/policy",{
			params: payload,
			withCredentials: true
		})
		.then((res) => {
			arr = arr.filter(item => item !== url);
			this.setState({urls: arr})
		})
		.catch((res) => {
			this.props.history.replace("/")
			window.localStorage.removeItem('user');
			alert("Your session has expired. Please log back in.")
		})
	}
	render(){
		
		return (
			<div>
				<AddPolicy onClick={this.onClickHandler}/>
				<PolicyList items={this.state.urls} onDelete={this.onDeleteHandler}/>
			</div>)
	}
}

export default Policy;