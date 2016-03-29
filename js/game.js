/**
 * @author Andreas Elia / http://github.com/andreaselia/
 */

var element = document.body;

var DEBUG = false;

var t = THREE;

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var ASPECT = WIDTH / HEIGHT;

var stats, loader;
var scene, camera, renderer, clock;
var controls, key;

// 0 = floor, 1 = wall, 2 = spawn point, 3 = gate

var Tile = {
    FLOOR: 0,
    WALL: 1,
    GATE: 3,
    SPAWN: 2
};

var Direction = {
    NORTH: 0,
    EAST: 1,
    SOUTH: 2,
    WEST: 3
}

var map = [];

// A list of textures that can be used in the map cubes (walls, floor, ceiling etc)
var textures = [];

// level followed by [floors][walls][ceilings][gate]
var levelTextures = [
    [
        [0],
        [1, 2],
        [3],
        [4]
    ]
];

var levelFog = [
    ['rgb(74, 86, 53)', 0.3]
];

// Keeps track if the game is in menu state, paused or in-game
var showGUI = false;

// Objects that can be collided with
var objects = [];

var mouse = new t.Vector2();

var radarDrawCount = 0;

var player;
var spawnSet;

var scale = 1;

var blocker = document.getElementById('blocker');

function init() {
    if (DEBUG) {
        // Create and add the stats to the application with default mode 0
        stats = new Stats();
        stats.setMode(0);
        document.body.appendChild(stats.domElement);
    }

    // Creates a new WebGL Renderer (used to render everything inc. scene)
    renderer = new t.WebGLRenderer();

    // Sets the Renderer to the window width and height
    renderer.setSize(WIDTH, HEIGHT);

    // Add the renderers DOM element to the window
    document.body.appendChild(renderer.domElement);

    // Adds the keyboard class that handles keyboard input
    key = new Keyboard();

    // Initialize the Clock so we can keep track of delta time etc
    clock = new t.Clock();

    // Creates a new scene object
    scene = new t.Scene();

    // Create the player
    player = new Player();

    // Initalize the player
    player.init();

    // Create a new perspective camera
    camera = new t.PerspectiveCamera(75, ASPECT, 0.1, 1000);

    // Set the camera default zoom
    camera.zoom = 0.5;

    // Create a new init of the controls and pass in the camera as the object
    controls = new t.PointerLockControls(camera);

    // Add the controls object to the scene
    scene.add(controls.getObject());

    // The texture loader allows textures to be loaded and kept track of
    loader = new t.TextureLoader();

    // Load Textures
    textures.push(loader.load('textures/floor0.png'));
    textures.push(loader.load('textures/wall0.png'));
    textures.push(loader.load('textures/wall1.png'));
    textures.push(loader.load('textures/ceiling0.png'));
    textures.push(loader.load('textures/gate0.png'));

    // Setup light in the scene
    var ambientLight = new t.AmbientLight(0xCCCCCC);

    // Add the ambient light to the scene
    scene.add(ambientLight);

    // Add the players cube to the scene
    scene.add(player.cube);

    // Adds fog to the scene
    scene.fog = new t.FogExp2(new t.Color(levelFog[0][0]), levelFog[0][1]);

    // Sets the filter for each texture making it pixelated rather than blurred
    for (var x = 0; x < textures.length; x++) {
        textures[x].magFilter = t.NearestFilter;
        textures[x].minFilter = t.NearestMipMapLinearFilter;
    }

    var radar = document.createElement('canvas');
    radar.id = 'radar';
    radar.width = 200;
    radar.height = 200;
    document.body.appendChild(radar);

    // Create the first level using the first level array
    setupLevel();
}

function setupLevel() {
    // Generate the dungeon (size, interations, minRoomSize, maxRoomSize, maxNumRooms, maxRoomArea)
    var generator = new Dungeon(32, 5, 7, 15, 34, 130);

    // Generate the map
    generator.init();

    // Set the current map array to the output that was generated
    map = generator.getOutput();

    // Some variables to deal with player spawning and what map is selected
    spawnSet = false;

    // Geometry used for walls, ceilings and floors
    var cubeGeometry = new t.CubeGeometry(scale, scale, scale);

    for (var x = 0; x < map.length; x++) {
        for (var z = 0; z < map[x].length; z++) {
            switch (map[x][z]) {
                case Tile.FLOOR:
                case Tile.SPAWN:
                case Tile.GATE:
                    if (map[x][z] == Tile.SPAWN && !spawnSet) {
                        controls.getObject().position.set(x * scale, 3 * scale, z * scale);
                        player.cube.position.set(x, 3, z);
                        spawnSet = true;
                    }

                    if (map[x][z] == Tile.GATE) {
                        var gate = new t.Mesh(cubeGeometry, new t.MeshLambertMaterial({
                            map: textures[levelTextures[0][3][0]],
                            side: t.FrontSide
                        }));

                        gate.position.set(x * scale, 3 * scale, z * scale);
                        gate.name = {
                            id: 'gate' + z + x,
                            z: z,
                            x: x
                        };
                        // Add gate to scene
                        scene.add(gate);

                        // Add gate to collisions array
                        objects.push(gate);
                    }

                    var floor = new t.Mesh(cubeGeometry, new t.MeshLambertMaterial({
                        map: textures[levelTextures[0][0][0]],
                        side: t.FrontSide
                    }));

                    floor.position.set(x * scale, 2 * scale, z * scale);

                    // Add floor to scene
                    scene.add(floor);

                    var ceiling = new t.Mesh(cubeGeometry, new t.MeshLambertMaterial({
                        map: textures[levelTextures[0][2][0]],
                        side: t.FrontSide
                    }));

                    ceiling.position.set(x * scale, 4 * scale, z * scale);

                    // Add ceiling to scene
                    scene.add(ceiling);
                    break;
                case Tile.WALL:
                    var wall = new t.Mesh(cubeGeometry, new t.MeshLambertMaterial({
                        map: textures[levelTextures[0][1][(levelTextures[0][1].length > 1) ? (Math.floor(Math.random() * levelTextures[0][1].length) + 1) - 1 : 0]],
                        side: t.FrontSide
                    }));

                    wall.position.set(x * scale, 3 * scale, z * scale);

                    // Add wall to scene
                    scene.add(wall);

                    // Add wall to collisions array
                    objects.push(wall);
                    break;
            }
        }
    }
}

function update() {
    var dt = clock.getDelta();

    // Update the player
    player.update(dt);
}

function drawRadar() {
    var ctx = document.getElementById('radar').getContext('2d');
    document.getElementById('radar').style.visibility = 'visible';
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    for (var x = 0; x < map.length; x++) {
        for (var z = 0; z < map[x].length; z++) {
            switch (map[x][z]) {
                case Tile.WALL:
                    ctx.fillStyle = '#4C4CFF';
                    ctx.fillRect(20 + x * 5, 20 + z * 5, 4, 4);
                    break;
                case Tile.GATE:
                    ctx.fillStyle = '#FF4C4C';
                    ctx.fillRect(20 + x * 5, 20 + z * 5, 4, 4);
                    break;
            }
        }
    }

    ctx.fillStyle = '#87CA6A';
    ctx.fillRect(20 + ((player.cube.position.x / scale) * 5), 20 + ((player.cube.position.z / scale) * 5), 4, 4);
}

function render() {
    // Render the scene
    renderer.render(scene, camera);

    // Do any needed player rendering
    player.render(scene, camera);

    // If showGUI is true, render the radar every X amount of seconds
    if (showGUI) {
        radarDrawCount++;

        if (radarDrawCount == 10) {
            radarDrawCount = 0;
            drawRadar();
        }
    }
}

/**
 * Handles the calling of the update and render functions as well as stats tracking
 */
function animate() {
    if (DEBUG) {
        stats.begin();
    }

    // Update and render the game
    update();
    render();

    if (DEBUG) {
        stats.end();
    }

    // Tells the browser we wish to recall the same function
    requestAnimationFrame(animate);
}

/**
 * Handles the window being resized and then resizes all game elements
 */
function onWindowResize() {
    // Set the WIDTH and HEIGHT variables to the new window width/height
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;

    // Set the camera aspect to the new aspect
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();

    // Set the renderer set
    renderer.setSize(WIDTH, HEIGHT);
}

/**
 * Handles mouse clicking
 * @param  {EventListener} event
 */
function onMouseDown(event) {
    event.preventDefault();

    if (event.button == 0) {
        var raycaster = new t.Raycaster();

        // Get a value between 1 and -1 for the mouse position on screen
        mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        var intersects = raycaster.intersectObjects(objects);

        if (intersects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].name.id == intersects[0].object.name.id && intersects[0].distance < 1.3 && objects.indexOf(objects[i]) > -1 && intersects[0].object.name != '') {
                    map[intersects[0].object.name.x][intersects[0].object.name.z] = 0;
                    objects.splice(objects.indexOf(objects[i]), 1);
                    scene.remove(intersects[0].object);
                }
            }
        }
    }
}

/**
 * Handles the showing and hiding of the main menu
 * @param  {EventListener} event
 */
function pointerlockchange(event) {
    if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
        controls.enabled = true;
        blocker.style.display = 'none';
    }
    else {
        controls.enabled = false;
        blocker.style.display = 'box';
    }
}

/**
 * Handles pointer lock controls
 * @param  {EventListener} max
 */
function pointerlockrequest(event) {
    // Request the pointer lock from the browser
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
    element.requestPointerLock();

    // Show the GUI
    showGUI = true;
}

/**
 * Starts the game by calling init and animate
 */
function start() {
    init();
    animate();
}

/**
 * Generates a random number between the two given parameters
 * @param  {Number} min
 * @param  {Number} max
 * @return {Number}
 */
function random(min, max) {
    // Return a random number between the two numbers given
    return Math.floor(Math.random() * (max - min) + min);
}

// For handling pointer lock controls
document.addEventListener('pointerlockchange', pointerlockchange, false);
document.addEventListener('mozpointerlockchange', pointerlockchange, false);
document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
document.addEventListener('click', pointerlockrequest, false);

// For handling clicking on gates
document.addEventListener('mousedown', onMouseDown, false);

// For handling resizing the window and changing the game to fit the new size
window.addEventListener('resize', onWindowResize, false);

// Start the game when the window has loaded
window.onload = start();
