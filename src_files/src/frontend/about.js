import React from 'react';
import axios from 'axios';

class About extends React.Component {
	constructor(props){
		super(props);
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
			//console.log(res.data);
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
				<p>Welcome to ProductivityIO! This an application to help you better focus and help gamify productivity.
					To help eliminate distractions, there is an associated chrome extension that works 
					together with this application to block websites. Just enter the urls 
					you would like to block to prevent you from getting distracted on the Policy tab. Input how long you want
					to focus on your work on the associated timer in the In the Zone tab and the chrome extension will help block those websites
					to keep you focused. There is also an associated mini-game to help reward those who are productive. If you
					succeed in staying on task for at least 20 minutes (with the timer decrementing to 0), you are allowed to play the mini-game.
					For every 20 minutes the timer is running without you entering the urls you inputted to block, your hero gains
					an additional health point. If you choose to cancel your timer or enter a website you inputted to block
					your hero loses a health point. There are tiers to the boss in the mini-game, so as you beat the boss, you advance
					to a higher tier. Harder tiers may require more health points for your hero, so keep being productive to help your
					hero beat the boss! Enjoy and unlock your potential!</p>
				<p>Disclaimer: This web app will only block urls while the timer is running with a tab opened up for this web app. This means
				if you choose to close this tab or enter a new url using this tab, the web app will no longer be blocking your inputted 
				urls.</p>
			</div>)
	}
}

export default About;