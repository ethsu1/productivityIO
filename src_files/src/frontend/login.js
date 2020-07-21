import React from 'react';
import ReactDOM from 'react-dom';
import { Card, Button, Container, Row, Navbar, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faUser } from '@fortawesome/free-solid-svg-icons';
import {useSpring, animated} from 'react-spring'
import Animation from './animation.js'
import './login.css';
import axios from 'axios';
import { GoogleLogin } from 'react-google-login';
import history from './history.js';

const CLIENT_ID = '445220943804-d28irgmv2s1ctaodq9r8u98uvgb8k646.apps.googleusercontent.com';
class LoginPage extends React.Component {
	//provide whatever the user inputs into the puzzle as the state
	constructor(props){
		super(props);
		this.state = {errorMsg: ''}

		this.successSignUp = this.successSignUp.bind(this);
		this.successSignIn = this.successSignIn.bind(this);
		this.failureSignup = this.failureSignup.bind(this);

	}

	successSignIn(response){
		var id = response.profileObj['googleId']
		var email = response.profileObj['email']
		window.localStorage.setItem('user', id);
		const params = new URLSearchParams();
		params.append('userid', id)
		params.append('email', email)
		axios.post('https://productivityio.azurewebsites.net/signin', params, { withCredentials: true})
		.then((res) => {
			if(res.data.Body.email.length == 0){
				this.setState({errorMsg: 'User does not exist, please create an account.'})
			}
			else {
				this.setState({errorMsg: ''})
				this.props.history.push("/dashboard")
			}
		})
	}


	successSignUp(response){
		var id = response.profileObj['googleId'];
		var email = response.profileObj['email'];
		window.localStorage.setItem('user', id);
		const params = new URLSearchParams();
		params.append('userid', id)
		params.append('email', email)
		axios.post('https://productivityio.azurewebsites.net/signup',params, {withCredentials: true})
		.then((res) => {
			if(res.data.Body.email.length != 0){
				this.setState({errorMsg: 'A user associated with the email (' + res.data.Body.email + ') already exists'})
			}
			else {
				this.setState({errorMsg: ''})
				this.props.history.push("/dashboard")
			}
		})
		//request to google server, then tell my go server to create new user
	}

	failureSignup(response){
		this.setState({errorMsg: "Something went wrong on Google's end. Please try again later."})
	}
	render() {
		return (<Container fluid className="backgroundlogin">
					<Row>
							<Navbar variant="dark" className="navbar" fluid>
								<Navbar.Brand className="title">Productivity.IO</Navbar.Brand>
							</Navbar>
							<Navbar variant="light" className="slogan" fluid>
								<Navbar.Brand className="slogantitle">Limit Distractions, Gamify Productivity, and Reach Your Goals!</Navbar.Brand>
							</Navbar>
					</Row>
					<Row>
						<Col>
							<Animation/>
						</Col>
					</Row>
					<Row>
						<Col>
							<Card>
								<GoogleLogin clientId={CLIENT_ID} className="signinbody" onSuccess={this.successSignIn} onFailure={this.failureSignup} cookiePolicy={'single_host_origin'}>
									<FontAwesomeIcon icon={faUser} size="lg"/>
									<span>Sign In</span>
								</GoogleLogin>
							</Card>
						</Col>
						<Col>
							<Card>
								<GoogleLogin clientId={CLIENT_ID} className="signupbody" onSuccess={this.successSignUp} onFailure={this.failureSignup} cookiePolicy={'single_host_origin'}>
									<FontAwesomeIcon icon={faUserPlus} size="lg"/>
									<span>Create Account</span>
								</GoogleLogin>
							</Card>
						</Col>
					</Row>
					<Row>
						<Col>
							<h3 className="errormsg">{this.state.errorMsg}</h3>
						</Col>
					</Row>
				</Container>); 
	}
}
export default LoginPage;