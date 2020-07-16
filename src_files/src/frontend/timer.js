import React, { useEffect } from 'react';
import { Button, Container, Row, Col, Form, Card } from 'react-bootstrap';
import NumericInput from 'react-numeric-input';
import './timer.css';
import moment from 'moment';
import axios from 'axios';

class Timer extends React.Component {
	constructor(props){
		super(props)
		this.state = {
			count: 0,
			hour: 0,
			minute: 0,
			start: "Start",
			time: 0
		}
		this.handleOnClick = this.handleOnClick.bind(this);
		this.handleHoursChange = this.handleHoursChange.bind(this);
		this.handleMinChange = this.handleMinChange.bind(this);
		this.handleCancel = this.handleCancel.bind(this);
		this.decrementCount = this.decrementCount.bind(this);
		this.formatTimer = this.formatTimer.bind(this);
	}

	handleOnClick() {
		var user = window.localStorage.getItem('user')
		const params = new URLSearchParams();
		params.append('user', user);
		if(this.state.start == "Start"){
			//this.setState({})
			params.append('timer', 1);
			axios.post("https://productivityio.azurewebsites.net/timer",params, {withCredentials: true})
			.catch((res) => {
				this.props.history.replace("/")
				window.localStorage.removeItem('user');
				alert("Your session has expired. Please log back in.")
			});
			var date = new Date(0);
			var hours = this.state.hour;
			var minute = this.state.minute;
			var totalSeconds = this.state.time;
			if(this.state.count === 0 || this.state.time === 0){
				totalSeconds = 60*(hours*60+minute);
			}
			date.setSeconds(totalSeconds);
			if(totalSeconds !== 0){
				var timerString = date.toISOString().substr(11,8);
				//var time = moment(timer);
				this.setState({time: totalSeconds});
				this.setState({count: timerString});
				this.setState({start: "Stop"});
				this.intervalHandle = setInterval(this.decrementCount, 1000);
			}
		}
		else{
			this.setState({start: "Start"});
			clearInterval(this.intervalHandle);
		}

	}

	decrementCount(){
		var sec = this.state.time % 60;
		var min = Math.floor(this.state.time /60);
		var hour = Math.floor(this.state.time /3600);
		if(hour == 0 & min === 0 & sec === 0){
			clearInterval(this.intervalHandle);
			//this.setState({count: 0})
			if(this.state.hour !== 0 || this.state.minute !== 0){
				//window.sessionStorage.setItem('canPlay', 1);
				var total_time = this.state.hour*60 + this.state.minute
				var user = window.localStorage.getItem('user')
				fetch("https://productivityio.azurewebsites.net/timer?user="+user, {credentials: 'include'})
				.then(r => r.json())
				.then(data =>{
					//updating database with values to allow user to play the mini-game
					if(data == 1 && total_time >= 20){
						const params = new URLSearchParams();
						params.append('play', Math.floor(total_time/20));
						params.append('user', user);
						params.append('healthIncrease', 1)
						axios.post("https://productivityio.azurewebsites.net/play",params,{withCredentials: true})
						.catch((res) => {
							this.props.history.replace("/")
							window.localStorage.removeItem('user');
							alert("Your session has expired. Please log back in.")
						})
						alert("Congrats on finishing a productivity session. Reward yourself by playing a minigame!")
						//timer is no longer running
						params.append('timer', 0)
						axios.post("https://productivityio.azurewebsites.net/timer",params,{withCredentials: true}).catch((res) => {
							this.props.history.replace("/")
							window.localStorage.removeItem('user');
							alert("Your session has expired. Please log back in.")
						});
					}
				})
				.catch((res) => {
					this.props.history.replace("/")
					alert("Your session has expired. Please log back in.")
				})
			}
			this.setState({start: "Start"});
		}
		else{
			this.setState({ time: this.state.time - 1});
			var timerString = this.formatTimer(this.state.time);
			this.setState({count: timerString});
		}
	}

	formatTimer(){
		var date = new Date(0);
		if(this.state.time === 0){
			return 0
		}
		date.setSeconds(this.state.time)
		return date.toISOString().substr(11,8);
	}

	handleHoursChange(value) {
		this.setState({hour: value});
	}

	handleMinChange(value) {
		this.setState({minute: value});
	}

	handleCancel(value){
		var user = window.localStorage.getItem('user')
		fetch("https://productivityio.azurewebsites.net/timer?user=" + user, {credentials: 'include'})
		.then(r => r.json())
		.then(data =>{
			//timer is still running
			if(data == 1){
				var answer = confirm("You are going to lower your hero's health by canceling. Are you sure?");
				if(answer){
					clearInterval(this.intervalHandle);
					var user = window.localStorage.getItem('user')
					//updating database with lowered health values
					const params = new URLSearchParams();
					params.append('play', 0);
					params.append('user', user);
					params.append('healthIncrease', -1)
					axios.post("https://productivityio.azurewebsites.net/play",params, {withCredentials: true})
					.catch((res) => {
						this.props.history.replace("/")
						window.localStorage.removeItem('user');
						alert("Your session has expired. Please log back in.")
					});
					params.append('timer', 0)
					axios.post("https://productivityio.azurewebsites.net/timer", params, {withCredentials: true})
					.catch((res) => {
						this.props.history.replace("/")
						window.localStorage.removeItem('user');
						alert("Your session has expired. Please log back in.")
					});
					this.setState({count: 0});
					this.setState({start: "Start"});
				}
			}
			//timer is no longer running because user cancelled timer by deciding to go through one of their forbidden policies
			else{
				clearInterval(this.intervalHandle);
				this.setState({count: 0});
				this.setState({start: "Start"});
			}
		})
		
	}
	render() {
		return (<div>
					<Container fluid>
						<Row>
							<Col sm={0}>
								<Card>
									<Card.Body>
										<Card.Title>Hours</Card.Title>
										<NumericInput min={0} max={100} onChange={valueAsNumber => this.handleHoursChange(valueAsNumber)}/>
									</Card.Body>
								</Card>
							</Col>
							<Col sm={0}>
								<Card>
									<Card.Body>
										<Card.Title>Minutes</Card.Title>
										<NumericInput min={0} max={59} onChange={valueAsNumber => this.handleMinChange(valueAsNumber)}/>
									</Card.Body>
								</Card>
							</Col>
						</Row>
						<Row>
							<h1>Time Left: {this.state.count}</h1>
						</Row>
						<Row>
							<Col xs={4}>
								<Button variant="primary" block onClick={this.handleOnClick}>{this.state.start}</Button>
							</Col>
							<Col xs={4}>
								<Button variant="secondary" disabled={this.state.count == 0} block onClick={this.handleCancel}>Cancel</Button>
							</Col>
						</Row>
					</Container>
				</div>)
	}

}

export default Timer;