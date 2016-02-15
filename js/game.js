var element = document.body;

var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;
var ASPECT = WIDTH / HEIGHT;
var NEAR = 1, FAR = 10000;
var UNITSIZE = 50, WALLSIZE = 16;

var t = THREE, stats, loader;
var scene, camera, renderer, clock, controls, key;

var map = [
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 1], 
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 1], 
	[1, 0, 0, 1, 1, 0, 1, 1, 0, 1], 
	[1, 0, 0, 1, 1, 0, 1, 1, 0, 1], 
	[1, 0, 0, 1, 1, 0, 1, 1, 0, 1], 
	[1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 
	[1, 1, 0, 1, 0, 0, 1, 0, 0, 1], 
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 1], 
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// data will store details for loot etc, maybe doors? maybe doors go in map
var data = [
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

var showGUI = false;

// Objects that can be collided with
var objects = [];

var position = new t.Vector3();
var moveSpeed = 20;
var speedIncrease = 100;

var mouse = new t.Vector2();

var raycaster;

var radarDrawCount = 0;

var player;

var blocker = document.getElementById( 'blocker' );

var pointerlockchange = function ( event ) {
	if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
		controlsEnabled = true;
		controls.enabled = true;
		blocker.style.display = 'none';
	} else {
		controls.enabled = false;
		blocker.style.display = 'box';
	}
};

document.addEventListener( 'pointerlockchange', pointerlockchange, false );
document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
document.addEventListener( 'click', function ( event ) {
	element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
	element.requestPointerLock()
	showGUI = true;
}, false );

function init() {
	// CTRL+U = source, F12 = dev tools
	stats = new Stats();
	stats.setMode(0);
	document.body.appendChild(stats.domElement);

	// Creates a new WebGL Renderer (used to render everything inc. scene)
	renderer = new t.WebGLRenderer();
	// Sets the Renderer to the window width and height
	renderer.setSize(WIDTH, HEIGHT);
	// Add the renderers DOM element to the window
	document.body.appendChild(renderer.domElement);

	// Adds the keyboard class that handles keyboard input
	key = new Keyboard(false);

	player = new Player();

	// Raycaster for collisions
	raycaster = new t.Raycaster();

	// The texture loader allows textures to be loaded and kept track of
	loader = new t.TextureLoader();

	// Initialize the Clock so we can keep track of delta time etc
	clock = new t.Clock();

	// Creates a new scene object
	scene = new t.Scene();
	// Adds fog to the scene
	scene.fog = new t.FogExp2(0x4a5635, 0.095);

	// create a new "Perspective" Camera
	camera = new t.PerspectiveCamera(75, ASPECT, NEAR, FAR);
	// Change the cameras position so it is centered within the map
	camera.position.y = UNITSIZE * 0.1;

	// Create a new init of the controls and pass in the camera as the object
	controls = new t.PointerLockControls(camera);
	// Add the controls object to the scene
	scene.add(controls.getObject());

	setupGame();
}

function setupGame() {
	// Since the walls, floor and ceiling are made of boxes we create a box geometry for them
	// PlaneGeometry?
	var scale = 5;
	var geometry = new t.CubeGeometry(scale, scale, scale);

	// A list of textures that can be used in the map cubes (walls, floor, ceiling etc)
	var textures = [
		loader.load( 'textures/floor0.png' ),
		loader.load( 'textures/wall0.png' ),
		loader.load( 'textures/wall1.png' ),
		loader.load( 'textures/ceiling0.png' )
	];

	// Sets the filter for each texture making it pixelated rather than blurred
	for (var x = 0; x < textures.length; x++) {
		textures[x].magFilter = t.NearestFilter;
		textures[x].minFilter = t.NearestMipMapLinearFilter;
	}

	for (var y = 0; y < map.length; y++) {
		for (var x = 0; x < map[0].length; x++) {
			switch(map[x][y]) {
				case 0:
					// Floor
					var floor = new t.Mesh(geometry, new t.MeshBasicMaterial({ map: textures[0], side: t.FrontSide }));
					floor.position.set(-20 + (x * scale), UNITSIZE * 0.2, -30 + (y * scale));
					scene.add(floor);

					// Ceiling
					var ceiling = new t.Mesh(geometry, new t.MeshBasicMaterial({ map: textures[3], side: t.FrontSide }));
					ceiling.position.set(-20 + (x * scale), UNITSIZE * 0.4, -30 + (y * scale));
					scene.add(ceiling);
					break;

				case 1:
					// Walls
					var wall = new t.Mesh(geometry, new t.MeshBasicMaterial({ map: textures[Math.floor(Math.random() * 2) + 1], side: t.FrontSide }));
					wall.position.set(-20 + (x * scale), UNITSIZE * 0.3, -30 + (y * scale));
					scene.add(wall);
					objects.push(wall);
					break;
			}
		}
	}

	var radar = document.createElement( 'canvas' );
	radar.id = "radar";
	radar.width = 302;
	radar.height = 152;
	document.body.appendChild(radar);
}

function update() {
	var delta = clock.getDelta();

	player.update();

	// console.log(radarDrawCount);
	// console.log(controls.getObject().position.x);

	// if (controls.getMouse() != undefined) {
	// 	console.log("mouse position: " + controls.getMouse().x);
	// }

	// will eventually work as pause
	if (key.down(key.ESC)) {
		document.pointerLockElement = null;
		controls.enabled = false;
		blocker.style.display = "box";
		key.reset(key.ESC);
	}

	if (key.down(key.ONE)) {
		key = new Keyboard(!key.leftHand);
	}

	if ((key.down(key.FORWARD) || key.down(key.ARROW_FORWARD)) && !collides(new t.Vector3(0, 0, -1), 2)) {
		if (position.z > -moveSpeed) {
			position.z -= speedIncrease * delta;
		}
	} else if ((key.down(key.BACK) || key.down(key.ARROW_BACK)) && !collides(new t.Vector3(0, 0, 1), 2)) {
		if (position.z < moveSpeed) {
			position.z += speedIncrease * delta;
		}
	} else {
		position.z = 0;
	}

	if ((key.down(key.LEFT) || key.down(key.ARROW_LEFT)) && !collides(new t.Vector3(-1, 0, 0), 2)) {
		if (position.x > -moveSpeed) {
			position.x -= speedIncrease * delta;
		}
	} else if ((key.down(key.RIGHT) || key.down(key.ARROW_RIGHT)) && !collides(new t.Vector3(1, 0, 0), 2)) {
		if (position.x < moveSpeed) {
			position.x += speedIncrease * delta;
		}
	} else {
		position.x = 0;
	}

	controls.getObject().translateX( position.x * delta );
	controls.getObject().translateY( position.y * delta );
	controls.getObject().translateZ( position.z * delta );

	// console.log('cam: ' + camera.position.z);
}

function drawRadar() {
	var ctx = document.getElementById( 'radar' ).getContext( '2d' );

	document.getElementById( 'radar' ).style.visibility = 'visible';

	ctx.clearRect(0, 0, WIDTH, HEIGHT);

	for (var y = 0; y < map.length; y++) {
		for (var x = 0; x < map[0].length; x++) {
			switch(map[x][y]) {
				case 1:
					// Walls
					ctx.fillStyle = '#0000FF';
					ctx.fillRect(x * 5, y * 5, 4, 4);
					break;
			}
		}
	}

	ctx.fillStyle = '#ff0000';
	ctx.fillRect(15 + (controls.getObject().position.x * 5) / map.length - 5, 15 + (controls.getObject().position.z * 5) / map.length, 4, 4);
}

function collides(vec, dist) {
	raycaster.setFromCamera(vec, camera);
	var intersects = raycaster.intersectObjects(objects);
	return (intersects.length > 0 && intersects[0].distance < dist) ? true : false;
}

function render() {
	renderer.render(scene, camera);
	player.render(scene, camera);

	if (showGUI) {
		radarDrawCount++;

		if (radarDrawCount == 10) {
			radarDrawCount = 0;
			drawRadar();
		}
	}
}

function animate() {
	stats.begin();
	update();
	render();
	stats.end();

	requestAnimationFrame(animate);
}

init();
animate();