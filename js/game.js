/**
 * @author Andreas Elia / http://github.com/andreaselia/
 */

var DEBUG = true; //false;

var stats, gui;

var t = THREE;

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var ASPECT = WIDTH / HEIGHT;

var scene, camera, renderer, clock, loader;
var controls, key;

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

// Store loaded textures here
var textures = [];

// Current level followed by [floors][walls][ceilings][gate]
var levelTextures = [
    [
        [0],
        [1, 2],
        [3],
        [4]
    ]
];

// Current level fog
var levelFog = [
    ['#4A5635', 0.3]
];

// Keeps track if the game is in menu state, paused or in-game
var showGUI = false;

// Objects that can be collided with
var objects = [];

// Store the current radar/minimap draw count
var radarDrawCount = 0;

// Store the player and if its spawn has been set
var player, spawnSet;

var blocker = document.getElementById('blocker');
var docElement = document.getElementById('gameDivContainer');

var element = blocker;

var generator = new DungeonGenerator(32, 7, 15, 34, 150);

/**
 * Sets up the GUI element used for modifying in-game elements
 */
function gui() {
    // If debug mode is active then create the stats
    if (DEBUG) {
        gui = new dat.GUI();
        gui.close();

        var dungeonOptions = {
            size: 32,
            minRoomSize: 7,
            maxRoomSize: 15,
            maxNumRooms: 34,
            roomIterations: 150
        };

        var generationFolder = gui.addFolder('Generation');

        generationFolder.add(dungeonOptions, 'size').min(1).max(300).step(1).onChange(function(value) {
            generator = new DungeonGenerator(value, dungeonOptions.minRoomSize, dungeonOptions.maxRoomSize, dungeonOptions.maxNumRooms, dungeonOptions.roomIterations);
            init();
        });

        generationFolder.add(dungeonOptions, 'minRoomSize').min(2).max(300).step(1).onChange(function(value) {
            generator = new DungeonGenerator(dungeonOptions.size, value, dungeonOptions.maxRoomSize, dungeonOptions.maxNumRooms, dungeonOptions.roomIterations);
            init();
        });

        generationFolder.add(dungeonOptions, 'maxRoomSize').min(2).max(300).step(1).onChange(function(value) {
            if (!(dungeonOptions.size < value)) {
                generator = new DungeonGenerator(dungeonOptions.size, dungeonOptions.minRoomSize, value, dungeonOptions.maxNumRooms, dungeonOptions.roomIterations);
                init();
            }
        });

        generationFolder.add(dungeonOptions, 'maxNumRooms').min(1).max(50).step(1).onChange(function(value) {
            generator = new DungeonGenerator(dungeonOptions.size, dungeonOptions.minRoomSize, dungeonOptions.maxRoomSize, value, dungeonOptions.roomIterations);
            init();
        });

        generationFolder.add(dungeonOptions, 'roomIterations').min(1).max(500).step(1).onChange(function(value) {
            generator = new DungeonGenerator(dungeonOptions.size, dungeonOptions.minRoomSize, dungeonOptions.maxRoomSize, dungeonOptions.maxNumRooms, value);
            init();
        });

        var playerOptions = {
            speed: 5,
            maxVelocity: 20
        };

        var playerFolder = gui.addFolder('Player');

        playerFolder.add(playerOptions, 'speed').min(1).max(10).step(1).onChange(function(value) {
            player.speed = value;
        });

        playerFolder.add(playerOptions, 'maxVelocity').min(1).max(100).step(1).onChange(function(value) {
            player.maxVelocity = value;
        });

        var fogOptions = {
            colour: '#4A5635',
            distance: 0.3
        };

        var fogFolder = gui.addFolder('Fog');

        fogFolder.addColor(fogOptions, 'colour').onChange(function(value) {
            // Adds fog to the scene
            scene.fog = new t.FogExp2(value, fogOptions.distance);
        });

        fogFolder.add(fogOptions, 'distance').min(0).max(3).step(0.1).onChange(function(value) {
            // Adds fog to the scene
            scene.fog = new t.FogExp2(fogOptions.colour, value);
        });
    }
}

/**
 * Initalizes all of the game elements
 */
function init() {
    // If debug mode is active then create the stats
    if (DEBUG) {
        // Create and add the stats to the application with default mode 0
        stats = new Stats();
        stats.setMode(0);
        document.body.appendChild(stats.domElement);
    }

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

    // Create and add the radar/minimap element
    var radar = document.createElement('canvas');
    radar.id = 'radar';
    radar.width = 200;
    radar.height = 200;
    document.body.appendChild(radar);

    // Create the first level using the first level array
    setupLevel();
}

/**
 * Sets up the level including walls, floors, ceilings, gates and the players start point
 */
function setupLevel() {
    // Generate the map
    generator.init();

    // Set the current map array to the output that was generated
    map = generator.getOutput();

    // Some variables to deal with player spawning and what map is selected
    spawnSet = false;

    // Geometry used for walls, ceilings and floors
    var cubeGeometry = new t.CubeGeometry(1, 1, 1);

    // Loop through the map
    for (var x = 0; x < map.length; x++) {
        for (var z = 0; z < map[x].length; z++) {
            switch (map[x][z]) {
                case Tile.FLOOR:
                case Tile.SPAWN:
                case Tile.GATE:
                    // If the current tile is a spawn tile and no spawn is set then set it
                    if (map[x][z] == Tile.SPAWN && !spawnSet) {
                        // Set the controls position
                        controls.getObject().position.set(x, 3, z);

                        // Set the players cube position
                        player.cube.position.set(x, 3, z);

                        // There is no longer a need to check for spawn set so set it to true
                        spawnSet = true;
                    }

                    // If the tile is a gate tile
                    if (map[x][z] == Tile.GATE) {
                        // Create a gate mesh
                        var gate = new t.Mesh(cubeGeometry, new t.MeshLambertMaterial({
                            map: textures[levelTextures[0][3][0]],
                            side: t.FrontSide
                        }));

                        // Set the gate position
                        gate.position.set(x, 3, z);

                        // Set the name for gate collision with mouse detection
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

                    // Create a floor mesh
                    var floor = new t.Mesh(cubeGeometry, new t.MeshLambertMaterial({
                        map: textures[levelTextures[0][0][0]],
                        side: t.FrontSide
                    }));

                    // Set the floor mesh position
                    floor.position.set(x, 2, z);

                    // Add floor to scene
                    scene.add(floor);

                    // Create a ceiling mesh
                    var ceiling = new t.Mesh(cubeGeometry, new t.MeshLambertMaterial({
                        map: textures[levelTextures[0][2][0]],
                        side: t.FrontSide
                    }));

                    // Set the ceiling mesh position
                    ceiling.position.set(x, 4, z);

                    // Add ceiling to scene
                    scene.add(ceiling);
                    break;
                case Tile.WALL:
                    // Create a wall mesh
                    var wall = new t.Mesh(cubeGeometry, new t.MeshLambertMaterial({
                        map: textures[levelTextures[0][1][(levelTextures[0][1].length > 1) ? (Math.floor(Math.random() * levelTextures[0][1].length) + 1) - 1 : 0]],
                        side: t.FrontSide
                    }));

                    // Set the wall mesh position
                    wall.position.set(x, 3, z);

                    // Add wall to scene
                    scene.add(wall);

                    // Add wall to collisions array
                    objects.push(wall);
                    break;
            }
        }
    }
}

/**
 * Handles the updating of everything in the game
 */
function update() {
    // Get the clocks delta time
    var dt = clock.getDelta();

    // Update the player
    player.update(dt);
}

/**
 * Handles drawing of the radar/minimap
 */
function drawRadar() {
    // Create a radar/minimap canvas element
    var ctx = document.getElementById('radar').getContext('2d');

    // Clear the canvas when called
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Loop through the map
    for (var x = 0; x < map.length; x++) {
        for (var z = 0; z < map[x].length; z++) {
            switch (map[x][z]) {
                case Tile.WALL:
                    // Drawing a wall tile
                    ctx.fillStyle = '#4C4CFF';
                    ctx.fillRect(20 + x * 5, 20 + z * 5, 4, 4);
                    break;
                case Tile.GATE:
                    // Drawing a gate tile
                    ctx.fillStyle = '#FF4C4C';
                    ctx.fillRect(20 + x * 5, 20 + z * 5, 4, 4);
                    break;
            }
        }
    }

    // Drawing the player at it's position but modified to fit on the minimap
    ctx.fillStyle = '#87CA6A';
    ctx.fillRect(20 + (player.cube.position.x * 5), 20 + (player.cube.position.z * 5), 4, 4);
}

/**
 * Renders everything in the game
 */
function render() {
    // Render the scene
    renderer.render(scene, camera);

    // If showGUI is true then render the radar every X time
    if (showGUI) {
        // Increase the radar draw counter
        radarDrawCount++;

        // If the radar draw count is equal to 10
        if (radarDrawCount == 10) {
            // Draw the radar
            drawRadar();

            // Reset the draw counter
            radarDrawCount = 0;
        }
    }
}

/**
 * Handles the calling of the update and render functions as well as stats tracking
 */
function animate() {
    // If debug mode is active enable stats
    if (DEBUG) {
        stats.begin();
    }

    // Update and render the game
    update();
    render();

    // If debug mode is active enable stats
    if (DEBUG) {
        stats.end();
    }

    // Tells the browser we wish to recall the same function whenever possible
    requestAnimationFrame(animate);
}

/**
 * Handles the window being resized and then resizes all game elements
 */
function onWindowResize() {
    // Set the WIDTH and HEIGHT variables to the new window width/height
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;

    // Set the camera aspect to the new aspect and update it's projection matrix
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();

    // Set the renderer set
    renderer.setSize(WIDTH, HEIGHT);
}

/**
 * Starts the game by calling init and animate
 */
function start() {
    // If debug mode is active then setup gui
    if (DEBUG) {
        gui();
    }

    // Creates a new WebGL Renderer (used to render everything inc. scene)
    renderer = new t.WebGLRenderer();

    // Sets the Renderer to the window width and height
    renderer.setSize(WIDTH, HEIGHT);

    // Add the renderers DOM element to the div element
    docElement.appendChild(renderer.domElement);

    // Call the init function to setup the game
    init();

    // Call the animate function to start calling update and render
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

/**
 * Handles activating and releasing the pointer lock element
 */
function pointerlockchange() {
    // Request for pointer lock as well as a handler for exit pointer lock
    element.requestPointerLock = element.requestPointerLock;
    element.exitPointerLock = element.exitPointerLock;

    // If the pointer lock element is equal to the current element
    if (document.pointerLockElement === element) {
        // Set the element to the game (docElement) element
        element = docElement;

        // Enable the controls
        controls.enabled = true;

        // Set visible the game element
        docElement.style.visibility = 'visible';

        // Set hidden the blocker element
        blocker.style.visibility = 'hidden';

        // Show the minimap element by setting its visibility to visible
        document.getElementById('radar').style.visibility = 'visible';

        // Show the gui/minimap element
        showGUI = true;

        // If debug mode print pointer lock status
        if (DEBUG) {
            console.log('Pointer lock is now locked');
        }
    } else {
        // This is an exit request so set the element to the blocker
        element = blocker;

        // Disable the controls
        controls.enabled = false;

        // Set the game element to hidden
        docElement.style.visibility = 'hidden';

        // Set the blocker element to visible
        blocker.style.visibility = 'visible';

        // Hide the minimap element by setting it's visibility to hidden
        document.getElementById('radar').style.visibility = 'hidden';

        // Set showGUi to false
        showGUI = false;

        // If debug mode print pointer lock status
        if (DEBUG) {
            console.log('Pointer lock no longer locked');
        }
    }
}

/**
 * Sends a request to activate the pointer lock when mouse is down on blocker element
 */
blocker.onmousedown = function() {
    // Request the pointerlock to the active element
    element.requestPointerLock();
}

/**
 * Handles actions with mouse clicking in-game
 * @param  {MouseEvent} event
 */
docElement.onclick = function(event) {
    // Prevent mouse default operations
    event.preventDefault();

    // If the mouse click is a left click
    if (event.button == 0) {
        // Create a raycaster
        var raycaster = new t.Raycaster();
        var mouse = new t.Vector2();

        // Get a value between 1 and -1 for the mouse position on screen
        mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

        // Set the raycaster from the camera to the mouse click
        raycaster.setFromCamera(mouse, camera);

        // Store any intersections with the objects (collidables) array
        var intersects = raycaster.intersectObjects(objects);

        // If there are any intersections
        if (intersects.length > 0) {
            // Loop through all of the cillidables in the objects array
            for (var i = 0; i < objects.length; i++) {
                // If the object is a gate and the player is within a set distance
                if (objects[i].name.id == intersects[0].object.name.id && intersects[0].distance < 1.3 && objects.indexOf(objects[i]) > -1 && intersects[0].object.name != '') {
                    // Set the map location of the gate to a floor tile
                    map[intersects[0].object.name.x][intersects[0].object.name.z] = 0;

                    // Remove the gate from the collisions array
                    objects.splice(objects.indexOf(objects[i]), 1);

                    // Remove the gate from the scene
                    scene.remove(intersects[0].object);
                }
            }
        }
    }
}

// Event listener for all things pointer lock related
document.addEventListener('pointerlockchange', pointerlockchange, false);

// Listens for when the window size changes and calls onWindowResize
window.addEventListener('resize', onWindowResize, false);

// Start the game when the window has loaded
window.onload = start();
