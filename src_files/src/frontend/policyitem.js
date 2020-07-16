import React from 'react';
import {ListGroup, Container, Row, Col, Button} from 'react-bootstrap'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import './policyitem.css';


class PolicyItem extends React.Component {
	constructor(props){
		super(props);

	}
	render(){
		return(
			<ListGroup.Item>
				<Container fluid>
					<Row>
						<Col className="url">
							{this.props.value}
						</Col>
						<Col md="auto">
							<Button onClick={(e) => this.props.onDelete(e, this.props.value)}>
								<FontAwesomeIcon icon={faTrash} size="lg"/>
							</Button>
						</Col>
					</Row>
				</Container>
			</ListGroup.Item>
			)
	}
}

export default PolicyItem;