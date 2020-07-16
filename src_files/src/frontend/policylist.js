import React from 'react';
import {ListGroup} from 'react-bootstrap';
import PolicyItem from './policyitem.js';

class PolicyList extends React.Component {
	constructor(props){
		super(props);

	}
	render(){
		return (
			<ListGroup>
				{this.props.items.map((url, idx) => (
					<PolicyItem key={idx} value={url} onDelete={this.props.onDelete}/>
					))

				}
			</ListGroup>
			)
	}
}

export default PolicyList;