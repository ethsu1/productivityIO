import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring'
import './styles.css'

function configuration(){
	return { xy: [0, 0], config: { mass: 20, tension: 550, friction: 200 } }
}

function position(x,y){
	return [x - window.innerWidth / 2, y - window.innerHeight / 2];
}
function move1(x,y){
	return `translate3d(${x / 10}px,${y / 10}px,0)`;
}

function move2(x,y){
	return `translate3d(${x/2 + 400}px,${y /4 + 100}px,0)`;
}

function move3(x,y){
	return `translate3d(${x+50/2}px,${y /4 + 100}px,0)`;
}

function move4(x,y){
	return `translate3d(${x /2 -100}px,${y/4 + 100}px,0)`;
}


function Animation() {
	//pass a function that returns values to useSpring, returns set function that allows you to update props without rendering component
	//update the component props via the set function
	//usually you can't update props, and updating state would rerender the whole component
	const [props, set] = useSpring(()=>configuration());
	return (
		//this outer div will update x,y based on the mouse's x,y
	    <div className="container" onMouseMove={({ clientX: x, clientY: y }) => set({ xy: position(x, y) })}>
	      <animated.div className="background" style={{ transform: props.xy.interpolate(move1) }} />
	      <animated.div className="obstacle" style={{ transform: props.xy.interpolate(move2) }} />
	      <animated.div className="symbol" style={{ transform: props.xy.interpolate(move3) }} />
	      <animated.div className="hero" style={{ transform: props.xy.interpolate(move4) }} />
	    </div>
	)
}

export default Animation;
