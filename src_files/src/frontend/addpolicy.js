import React from 'react';
import { Form, Button, Container, Col, Row } from 'react-bootstrap';

class AddPolicy extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			url: ''
		}
		this.handleOnChange = this.handleOnChange.bind(this);
	}

	handleOnChange(event){
		this.setState({url: event.target.value});
	}
	render(){
		return	(

			<Form>
				<Form.Label>Add urls that you want to block increase your productivity</Form.Label>
				<Form.Row>
					<Col>
						<Form.Control placeholder="add url ex. instagram.com" onChange={this.handleOnChange} value={this.state.url}/>
					</Col>
					<Col>
						<Button type="submit" onClick={(e) => {
							this.props.onClick(e,this.state.url)
							this.setState({url: ''})
						}}>Submit</Button>
					</Col>
				</Form.Row>
			</Form>)

	}
}

export default AddPolicy;