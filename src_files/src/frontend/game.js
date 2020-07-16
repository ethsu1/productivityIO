import React from 'react';
import { Button } from 'react-bootstrap';
import * as PIXI from 'pixi.js';
import axios from 'axios';
import regeneratorRuntime from "regenerator-runtime";
class Game extends React.Component {
	constructor(props){
		super(props);

		this.state = {
			start: false,
			json: {},
			renderer: new PIXI.Application({width: 800, height: 600}),
			gameScene: new PIXI.Container(),
			gameOverScene: new PIXI.Container(),
			enemyjson: {},
			firejson: {},
			health: 0,
			tier: "",
			canStart: false,
			healthleft: "",
			tierText: "",
			gameOverText: "",
			ticker: new PIXI.Ticker(),
		}
		//this.createHeroRight = this.createHeroRight.bind(this);
		this.onClickHandler = this.onClickHandler.bind(this);

	}

	async componentDidMount(){
		var value = window.localStorage.getItem('user');
		//document.body.style.overflow = "hidden";
		this.mount.appendChild(this.state.renderer.view);
 


		this.state.renderer.stage.interactive = true;
		this.state.renderer.stage.addChild(this.state.gameScene);
		this.state.renderer.stage.addChild(this.state.gameOverScene);
		//get background
		var background = await PIXI.Texture.from("https://productivityio.azurewebsites.net/background");
		var backgroundSprite = new PIXI.Sprite(background)
		this.state.gameScene.addChild(backgroundSprite);

		var wrapStyle = new PIXI.TextStyle({fontSize: '35px', fill: 'white', align: 'center', wordWrap: true, wordWrapWidth: 800})
		var gameOverText = new PIXI.Text("Waiting...",wrapStyle);
		gameOverText.anchor.set(0.5);
		gameOverText.x = this.state.renderer.view.width/2;
		gameOverText.y = this.state.renderer.view.height/2;
		this.setState({ gameOverText: gameOverText});
		this.state.gameOverScene.addChild(gameOverText);
		this.state.gameScene.visible = false;
		this.state.gameOverScene.visibile = true;

		await axios.get("https://productivityio.azurewebsites.net/herojson")
		.then((res) =>{
			this.setState({json: res.data.frames})
		})

		await axios.get("https://productivityio.azurewebsites.net/badjson")
		.then((response) =>{
			this.setState({enemyjson: response.data.frames})
		})

		await axios.get("https://productivityio.azurewebsites.net/firejson")
		.then((response) =>{
			this.setState({firejson: response.data.frames})
		})

		//determines the number of hits required to destroy the boss
		var tierDict = { "Wolf": 2, "Tiger": 5, "Demon": 8, "Dragon": 10, "God": 15}

		//display number of items left and tier level
		var healthLeft = new PIXI.Text("Health left: ", { font: '35px Snippet', fill: 'white', align: 'left' });
		this.setState({healthLeft: healthLeft})
		healthLeft.x = this.state.renderer.view.width/10;
		healthLeft.y = this.state.renderer.view.height/12;
		this.state.gameScene.addChild(healthLeft);
		var tierLevel = new PIXI.Text("Tier: ", { font: '35px Snippet', fill: 'white', align: 'right' })
		this.setState({tierText: tierLevel})
		tierLevel.x = 7*this.state.renderer.view.width/10;
		tierLevel.y = this.state.renderer.view.height/12;
		this.state.gameScene.addChild(tierLevel);
		this.state.renderer.loader.add('hero', 'https://productivityio.azurewebsites.net/hero').add('enemy', 'https://productivityio.azurewebsites.net/bad').add('fire', 'https://productivityio.azurewebsites.net/fire')
	}

	async onClickHandler(){
		var value = window.localStorage.getItem('user')
		//get the health and tier of the user
		await axios.get("https://productivityio.azurewebsites.net/healthtier", {
			params: {
	      		user: value
	    	},
	    	withCredentials: true,
	    })
		.then(res =>{
			this.setState({health: parseInt(res.data.Body.health) })
			this.setState({tier: res.data.Body.tier})
		})
		.catch((res) => {
			this.props.history.replace("/")
			window.localStorage.removeItem('user');
		})
		await axios.get("https://productivityio.azurewebsites.net/play", {
			params: {
	      		user: value
	    	},
	    	withCredentials: true,
	    })
		.then((res) => {
			if(res.data.Body.play == '1'){
				this.setState({canStart: parseInt(res.data.Body.play)});
			}
			else{
				alert("You have to set the timer for 25 minutes of uninterrupted work to play (or play again)")
			}
		})
		.catch((res) => {
			this.props.history.replace("/")
			window.localStorage.removeItem('user');
		})
	}

	componentDidUpdate(prevProps,prevState){
		if(this.state.canStart && !prevState.canStart){
			//prevent game from being executed again after play button has been clicked once (after timed session)
			this.setState({canStart: false});
			var user = window.localStorage.getItem('user')
			const params = new URLSearchParams();
			params.append('play', 0);
			params.append('user', user);
			axios.post("https://productivityio.azurewebsites.net/play",params,{withCredentials: true})
			//session timeout
			.catch((res) => {
				this.props.history.replace("/")
				window.localStorage.removeItem('user');
			});
			var hero;
			var enemy;
			var fireballs = [];
			var fireball_speed = 3;
			var hero_speed = 3;
			var componentState = this;
			var json = this.state.json;
			var enemyJson = this.state.enemyjson;
			var fireJson = this.state.firejson;
			var health = this.state.health;
			var tier = this.state.tier;
			//determines the number of hits required to destroy the boss
			var tierDict = { "Wolf": 2, "Tiger": 5, "Demon": 8, "Dragon": 10, "God": 15}
			var nextLevel = {"Wolf": "Tiger", "Tiger": "Demon", "Demon" : "Dragon", "Dragon": "God"}
			var healthLeft = this.state.healthLeft;
			healthLeft.text = "Health Left: " + health;
			var tierText = this.state.tierText;
			tierText.text = "Tier: " +  tier; 
			var heroSheet = {};
			var enemySheet = {};
			var fireSheet = {};
			var gameScene = this.state.gameScene;
			var gameOverScene = this.state.gameOverScene;
			var gameState;
			var renderer  = this.state.renderer;
			var ticker = this.state.ticker;
			var gameOverText = this.state.gameOverText;
			this.state.gameScene.visible = true;
			this.state.gameOverScene.visible = false;
			this.state.renderer.loader.load(setup);
			//this.state.renderer.ticker.start();
			function createHeroMove(){
				var ssheet = new PIXI.BaseTexture.from(renderer.loader.resources['hero'].url);
				var w = 216;
				var h = 108;
				var keys = Object.keys(json)
				var walkR = "walk_right";
				var walkL = "walk_left";
				var attackR = "attack_right";
				var attackL = "attack_left";
				var die = "die";
				var dizzy = "dizzy";
				var idleL = "idle_left";
				var idleR = "idle_right";
				var win = "win";
				var attackXR = [];
				var attackXL = [];
				var dieX = [];
				var dizzyX = [];
				var idleXL = [];
				var idleXR = [];
				var walkXL = [];
				var walkXR = [];
				var winX = [];

				keys.forEach(e => {
					if(e.includes(attackR)){
						attackXR.push(json[e]['frame']['x'])
					} 
					else if(e.includes(attackL)){
						attackXL.push(json[e]['frame']['x'])
					} 
					else if(e.includes(die)){
						dieX.push(json[e]['frame']['x'])
					} 
					else if(e.includes(dizzy)){
						dizzyX.push(json[e]['frame']['x'])
					} 
					else if(e.includes(idleL)){
						idleXL.push(json[e]['frame']['x'])
					} 
					else if(e.includes(idleR)){
						idleXR.push(json[e]['frame']['x'])
					}
					else if(e.includes(walkL)){
						walkXL.push(json[e]['frame']['x'])
					} 
					else if(e.includes(walkR)){
						walkXR.push(json[e]['frame']['x'])
					} else if(e.includes(win)) {
						winX.push(json[e]['frame']['x'])
					}

				})
				//var values = Object.values(json)
				//var xValues = values.map(e => e['frame']['x'])
				heroSheet[attackR] = attackXR.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
				heroSheet[attackL] = attackXL.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))

				heroSheet[die] = dieX.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
				heroSheet[dizzy] = dizzyX.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
				heroSheet[idleL] = idleXL.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
				heroSheet[idleR] = idleXR.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))

				heroSheet[walkL] = walkXL.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
				heroSheet[walkR] = walkXR.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
				heroSheet[win] = winX.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
			}


			function createEnemyMove(){
				var ssheet = new PIXI.BaseTexture.from(renderer.loader.resources['enemy'].url);
				var w = 216;
				var h = 108;
				var keys = Object.keys(enemyJson)
				var right = "strike_right";
				var left = "strike_left";
				var attackL = "attack_left";
				var attackR = "attack_right";
				var die = "die";
				var dizzy = "dizzy";
				var idleL = "idle_left";
				var idleR = "idle_right"
				var win = "win";
				var attackXL = [];
				var attackXR = [];
				var dieX = [];
				var dizzyX = [];
				var idleXL = [];
				var idleXR = [];
				var leftX = [];
				var rightX = [];
				var winX = [];

				keys.forEach(e => {
					if(e.includes(attackL)){
						attackXL.push(enemyJson[e]['frame']['x'])
					} else if(e.includes(attackR)){
						attackXR.push(enemyJson[e]['frame']['x'])
					}  else if(e.includes(die)){
						dieX.push(enemyJson[e]['frame']['x'])
					} else if(e.includes(dizzy)){
						dizzyX.push(enemyJson[e]['frame']['x'])
					} else if(e.includes(idleL)){
						idleXL.push(enemyJson[e]['frame']['x'])
					} else if(e.includes(idleR)){
						idleXR.push(enemyJson[e]['frame']['x'])
					} else if(e.includes(left)){
						leftX.push(enemyJson[e]['frame']['x'])
					} else if(e.includes(right)){
						rightX.push(enemyJson[e]['frame']['x'])
					} else{
						winX.push(enemyJson[e]['frame']['x'])
					}

				})
			
				enemySheet[attackL] = attackXL.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
				enemySheet[attackR] = attackXR.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))

				enemySheet[die] = dieX.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
				enemySheet[dizzy] = dizzyX.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
				enemySheet[idleL] = idleXL.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
				enemySheet[idleR] = idleXL.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))

				enemySheet[left] = leftX.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
				enemySheet[right] = rightX.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
				enemySheet[win] = winX.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
				//heroSheet["right"] = xValues.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)))
			}

			function createFireMove(){
				var ssheet = new PIXI.BaseTexture.from(renderer.loader.resources['fire'].url);
				var w = 120;
				var h = 66;
				var keys = Object.keys(fireJson);
				var left = "left"
				var right = "right"
				var leftX = [];
				var rightX = [];
				keys.forEach(e => {
					if(e.includes(left)){
						leftX.push(fireJson[e]['frame']['x']);
					} else if(e.includes(right)){
						rightX.push(fireJson[e]['frame']['x']);
					}
				});
				fireSheet[left] = leftX.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)));
				fireSheet[right] = rightX.map(i => new PIXI.Texture(ssheet, new PIXI.Rectangle(i, 0, w, h)));

			}
			function setup(){
				gameScene.visible = true;
				gameOverScene.visible = false;
				createHeroMove();
				createHero();
				createEnemyMove();
				createEnemy();
				createFireMove();
				gameState = play;
				ticker.add(gameLoop);
				ticker.start();
				//renderer.ticker.add(delta => gameLoop(delta));

			}
			/*function doneEnemy(){
				createEnemyMove();
				createEnemy();
				renderer.ticker.add(gameLoop);
			}*/


			function createHero(){
				hero = new PIXI.AnimatedSprite(heroSheet.idle_right);
				//upper left corner is anchor
				hero.anchor.set((0,0))
				//hero.hitArea = heroHitArea["idle"]
				//hero.anchor.set(0.5)
				//hero.width /= 2;
				//hero.height /= 2;
				hero.animationSpeed = 0.25;
				hero.loop = false;
				hero.x = 0;
				hero.y = renderer.view.height-108;
				hero.speed = hero_speed;
				gameScene.addChild(hero);
				hero.play();
				hero.alive = true;
				//is direction right
				hero.direction = true;
				hero.health = health;
				hero.atk = false;
				hero.name = "hero";

				return hero;
			}

			function createEnemy(){
				enemy = new PIXI.AnimatedSprite(enemySheet.strike_left);
				enemy.anchor.set(0.5);
				//hero.width /= 2;
				//hero.height /= 2;
				enemy.animationSpeed = 0.25;
				enemy.loop = false;
				enemy.x = 3*renderer.view.width/4;
				enemy.y = 2*renderer.view.height/5;
				gameScene.addChild(enemy);
				enemy.play();
				enemy.health = tierDict[tier]
				enemy.alive = true;
				//is direction left
				enemy.direction = true;
				enemy.name = "enemy";
				return enemy;
			}

			function createFireball(){
				var fireball;
				if(enemy.direction == true){
					fireball = new PIXI.AnimatedSprite(fireSheet.left);
					//if fireball is mvoing left
					fireball.direction = true;
				}
				else{
					fireball = new PIXI.AnimatedSprite(fireSheet.right);
					fireball.direction = false;
				}
				//fireball.anchor.set(0.5);
				fireball.animationSpeed = 0.25;
				fireball.anchor.set((0,0))
				fireball.loop = false;
				fireball.width /= 3;
				fireball.height /= 3;
				fireball.x = enemy.x;
				fireball.y = enemy.y;
				fireball.play();
				fireball.speed = fireball_speed;
				gameScene.addChild(fireball);
				fireball.dead = false;
				fireball.hit = false;
				fireball.bounce = false;
				fireball.name="fireball";
				return fireball;
			}
			var keys = {}
			window.addEventListener("keydown", keysDown);
			window.addEventListener("keyup", keysUp);
			function keysDown(e){
				keys[e.keyCode] = true;
			}
			function keysUp(e){
				keys[e.keyCode] = false;
			}

			//the key logic for moving the hero
			function animateHero(){
				//attack
				if(keys["16"]){
					if(!hero.playing & hero.direction === true){
						hero.textures = heroSheet.attack_right;
						hero.play();
						hero.atk = true;
							
					}
					else if(!hero.playing & hero.direction === false){
						hero.textures = heroSheet.attack_left;
						hero.play();
						hero.atk = true;
							
					}
				}
				//move right
				if(keys["39"] & !keys["37"]){
					if(!hero.playing){
						hero.textures = heroSheet.walk_right;
						hero.play();
						hero.atk = false;
					}
					if(hero.x + 140 < renderer.view.width){
						if(keys["16"]){
							hero.x += hero.speed-1;
							hero.atk = true;
						}
						else{
							hero.x += hero.speed;
							hero.atk = false;
						}
						hero.direction = true;
					}
					//hero.position.x += 5;
				}
				//move left
				if(keys["37"] & !keys["39"]){
					if(!hero.playing){
							hero.textures = heroSheet.walk_left;
							hero.play();

							hero.atk = false;
							//keys["39"] = false;
					}
					//hero is anchored in upper right corner and need to account for the actual length of the hero
					if(hero.x + 90>= 0 ){
						if(keys["16"]){
							hero.x -= hero.speed-1;
							hero.atk = true;
						}
						else{
							hero.x -= hero.speed;
							hero.atk = false;
						}
						hero.direction = false;
					}
				}
				if(!keys["37"] & !keys["16"] & !keys["39"]){
					if(!hero.playing & hero.direction === true){
						hero.textures = heroSheet.idle_right;
						hero.play();	
						hero.atk = false;
					}
					else if(!hero.playing & hero.direction === false){
						hero.textures = heroSheet.idle_left;
						hero.play();
						hero.atk = false;
					}
				}
				if(hero.health <= 0){
					
					hero.textures = heroSheet.die;
					hero.play()
					hero.alive = false;
				}
				//press Z to do win emote
				/*if(!enemy.alive && keys["90"]){
					hero.textures = heroSheet.win;
					hero.play()
				}*/
			}

			function animateEnemy(){

				var speed = 2;
				if(enemy.alive){
					if(enemy.direction){
						if(enemy.x > 65){
							enemy.x -= speed;
						}
						else{
							//if(!enemy.playing){
							enemy.textures = enemySheet.strike_right;
							enemy.play()
							//}
							enemy.direction = false
							enemy.x += speed;
						}
					}
					if(!enemy.direction){
						//enemy is anchored in upper right corner and need to account for actual width of eneny
						if(enemy.x + 65 < renderer.view.width){
							enemy.x += speed;
						}
						else{
							//if(!enemy.playing){
							enemy.textures = enemySheet.strike_left;
							enemy.play()
							//}
							enemy.direction = true;
							enemy.x -= speed;

						}
					}
				}
				if(enemy.health <= 0){
					if(!enemy.playing){
						enemy.textures = enemySheet.die;
						enemy.play()
						enemy.alive = false;
					}
				}
			}

			function updateFireballs(){
				for(let i = 0; i < fireballs.length; i++){
					//fireballs[i].y += fireballs[i].speed;
					if(fireballs[i].direction){
						if(fireballs[i].hit){
							fireballs[i].y -= fireballs[i].speed-2;
						}
						else{
							fireballs[i].y += fireballs[i].speed;
						}
						fireballs[i].x -= fireballs[i].speed;
					}
					else{
						if(fireballs[i].hit){
							fireballs[i].y -= fireballs[i].speed-2;
						}
						else{
							fireballs[i].y += fireballs[i].speed;
						}
						fireballs[i].x += fireballs[i].speed;
					}
					//if hero hit the fireball with sword when hero is facing right and fireball is moving left
					if(hero.direction && fireballs[i].direction && hero.atk){
						if(checkCollision(hero, fireballs[i], 90, 43, 90,65)){
							fireballs[i].hit = true;
							fireballs[i].direction = !fireballs[i].direction;
							//make fireball animation to the right
							fireballs[i].textures = fireSheet.right;
							fireballs[i].play();
						}
					}
					//if hero hit the fireball with sword when hero is facing left and fireball is moving right
					else if(!hero.direction && !fireballs[i].direction && hero.atk){
						if(checkCollision(hero, fireballs[i], 35, 43, 45,65)){
							fireballs[i].hit = true;
							fireballs[i].direction = !fireballs[i].direction;
							//make fireball animation to the left
							fireballs[i].textures = fireSheet.left;
							fireballs[i].play();
						}
					}


					//if enemy is moving left
					if(enemy.direction) {
						if(fireballs[i].hit && checkCollision(enemy, fireballs[i], 65, 54, 65, 52)){
							enemy.health -= 1
							if(enemy.health > 0){
								enemy.textures = enemySheet.dizzy;
								enemy.play();
								/*enemy.onComplete = ()=>{
									enemy.textures = enemySheet.strike_left;
									enemy.play();
								};*/
							}
							fireballs[i].dead = true;
							//renderer.stage.removeChild(fireballs[i]);
						}
					}
					else{
						if(fireballs[i].hit && checkCollision(enemy, fireballs[i], 85, 54, 65, 52)){
							enemy.health -= 1
							if(enemy.health > 0){
								enemy.textures = enemySheet.dizzy;
								enemy.play();
								/*enemy.onComplete = ()=>{
									enemy.textures = enemySheet.strike_right;
									enemy.play();
								};*/
							}
							fireballs[i].dead = true;
							//renderer.stage.removeChild(fireballs[i]);
						}
					}

					//if fireballs hit hero when hero
					if(checkCollision(hero, fireballs[i], 90, 43, 40, 65) ){
						if(hero.alive){
							hero.health -= 1;
							hero.textures = heroSheet.dizzy;
							hero.play();
							fireballs[i].dead = true;
						}
					}
					//fireballs go off screen
					if(fireballs[i].y > 600){
						fireballs[i].dead = true;
					}
				}

				for(let j = 0; j < fireballs.length; j++){
					//check if fireball hit the boundaries
					if(!fireballs[j].direction){
						//if fireball moving right hit boundaries
						if(fireballs[j].x >= renderer.view.width - fireballs[j].width && !fireballs[j].bounce && fireballs[j].hit){
							fireballs[j].textures = fireSheet.left;
							fireballs[j].play();
							fireballs[j].bounce = true;
							fireballs[j].direction = true;
						}
						else if(fireballs[j].x >= renderer.view.width - fireballs[j].width && fireballs[j].bounce && fireballs[j].hit){
							fireballs[j].dead = true;
						}

					}
					else{
						//if fireballs moving left hit boundaries
						if(fireballs[j].x <= 0 && !fireballs[j].bounce && fireballs[j].hit){
							fireballs[j].textures = fireSheet.right;
							fireballs[j].play();
							fireballs[j].bounce = true;
							fireballs[j].direction = false;
						}
						else if(fireballs[j].x <= 0 && fireballs[j].bounce && fireballs[j].hit){
							fireballs[j].dead = true;
						}

					}
					if(fireballs[j].dead){
						gameScene.removeChild(fireballs[j]);
						fireballs.splice(j,1);
					}
				}

			}

			function checkCollision(a, b, x, y, w, h){
				let aBox = a.getBounds();
				var nBox = new PIXI.Rectangle(aBox.x+x, aBox.y+y, w, h)
				let bBox = b.getBounds();
				return nBox.x + nBox.width > bBox.x && nBox.x < bBox.x + bBox.width && nBox.y + nBox.height > bBox.y && nBox.y < bBox.y + bBox.height;
			}


			function play(delta){
				//change health
				healthLeft.text = "Health Left: " + hero.health;
				var random = Math.floor(Math.random() * 500);
				if(random < 10 && enemy.alive && fireballs.length < tierDict[tier] ){
					//adjusting enemy animation
					if(enemy.direction){
						enemy.textures = enemySheet.attack_left;
						enemy.play()
					}
					else{
						enemy.textures = enemySheet.attack_right;
						enemy.play()
					}
					let fireball = createFireball();
					fireballs.push(fireball);
				}
				updateFireballs();
				animateEnemy();
				if(hero.alive == true){
					animateHero()
				}
				//enemy won
				if(!hero.alive){
					//renderer.ticker.stop();
					hero.onComplete = () => {
						gameOverText.text = "You lost! Recommend doing another timed productivity session to increase your hero's health..."
						gameOverScene.visible = true;
						gameScene.visible = false;
						gameState = end;
					}
				}

				//hero won
				if(!enemy.alive && enemy.onComplete == null && hero.alive){
					//renderer.ticker.stop();
					const params = new URLSearchParams();
					params.append('user', window.localStorage.getItem('user'))
					params.append('tier', nextLevel[tier])
					axios.post("https://productivityio.azurewebsites.net/nexttier", params, {withCredentials: true})
					.catch((res) => {
						this.props.history.replace("/")
						window.localStorage.removeItem('user');
					})
					tierText.text = "Tier: " + nextLevel[tier]
					enemy.onComplete = () => {
						gameOverText.text = "You won! You upgraded your tier to: " + nextLevel[tier];
						gameOverScene.visible = true;
						gameScene.visible = false;
						gameState = end;
					}
				}
			}
			function gameLoop(delta){
				gameState(delta)
			}
			
			//end of game
			function end(delta){
				//componentState.setState({canStart: false})
				gameOverScene.visible = true;
				gameScene.visible = false;
				gameScene.removeChild(enemy);
				gameScene.removeChild(hero);
				//remove all the fireballs
				var removal = []
				for(let j = 0; j < gameScene.children.length; j++){
					if(gameScene.children[j].name === "fireball"){
						removal.push(j)
					}
				}
				for(let i = 0; i < removal.length; i++){
					gameScene.children.pop()
				}
				fireballs = {};
				ticker.remove(gameLoop);
				ticker.stop();
				window.removeEventListener("keydown", keysDown);
				window.removeEventListener("keyup", keysUp);
			}
		}

	}

	render(){
		return (

			<div>
				<div ref={ref => (this.mount = ref)}  />
				<Button onClick={this.onClickHandler}>Play</Button>
			</div>)
	}

}


export default Game;