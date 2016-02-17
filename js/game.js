var element = document.body;

var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;
var ASPECT = WIDTH / HEIGHT;
var UNITSIZE = 50,
    WALLSIZE = 16;

var t = THREE,
    stats, loader;
var scene, camera, renderer, clock, controls, key;

// A list of textures that can be used in the map cubes (walls, floor, ceiling etc)
var textures = [];

// level followed by [floors][walls][ceilings]
var levelTextures = [ [[0], [1, 2], [3]], [[4], [5], [6]] ];

var mapOne = [
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

var mapTwo = [
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
var dataOne = [
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

// What level is currently displayed
var currentMap = mapTwo;

// Keeps track if the game is in menu state, paused or in-game
var showGUI = false;

// Objects that can be collided with
var objects = [];

var mouse = new t.Vector2();

var raycaster;

var radarDrawCount = 0;

var player;

var blocker = document.getElementById('blocker');

var pointerlockchange = function(event) {
    if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
        controlsEnabled = true;
        controls.enabled = true;
        blocker.style.display = 'none';
    } else {
        controls.enabled = false;
        blocker.style.display = 'box';
    }
};

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
    key = new Keyboard();

    player = new Player();

    // Raycaster for collisions
    raycaster = new t.Raycaster();

    // The texture loader allows textures to be loaded and kept track of
    loader = new t.TextureLoader();

    // Add textures
    // Level one
    textures.push(loader.load('textures/floor0.png'));
    textures.push(loader.load('textures/wall0.png'));
    textures.push(loader.load('textures/wall1.png'));
    textures.push(loader.load('textures/ceiling0.png'));

    // Level two
    textures.push(loader.load('textures/floor1.png'));
    textures.push(loader.load('textures/wall2.png'));
    textures.push(loader.load('textures/ceiling1.png'));

    // Initialize the Clock so we can keep track of delta time etc
    clock = new t.Clock();

    // Creates a new scene object
    scene = new t.Scene();
    // Adds fog to the scene
    scene.fog = new t.FogExp2(0x4a5635, 0.095);

    // create a new "Perspective" Camera
    camera = new t.PerspectiveCamera(75, ASPECT, 1, 1000);
    // Change the cameras position so it is centered within the map
    camera.position.y = UNITSIZE * 0.1;

    // Create a new init of the controls and pass in the camera as the object
    controls = new t.PointerLockControls(camera);
    // Add the controls object to the scene
    scene.add(controls.getObject());

    setupGame(currentMap);
}

function setupGame(level) {
    // Create a box geometry (future maybe PlaneGeometry) for walls, floor and ceiling
    var scale = 5;
    var geometry = new t.CubeGeometry(scale, scale, scale);

    // Id value of the current level, values are 1 less than level
    var currentLevel = ((currentMap == mapOne) ? 0 : 1);

    // var levelTextures = [ [[0], [1, 2], [3]], [[4], [5], [6]] ];

    // Sets the filter for each texture making it pixelated rather than blurred
    for (var x = 0; x < textures.length; x++) {
        textures[x].magFilter = t.NearestFilter;
        textures[x].minFilter = t.NearestMipMapLinearFilter;
    }
console.log((levelTextures[currentLevel][1].length > 1) ? (Math.floor(Math.random() * levelTextures[currentLevel][1].length) + 1) - 1 : 0);
    for (var y = 0; y < level.length; y++) {
        for (var x = 0; x < level[0].length; x++) {
            switch (level[x][y]) {
                case 0:
                    // Floor
                    var floor = new t.Mesh(geometry, new t.MeshBasicMaterial({
                        map: textures[levelTextures[currentLevel][0][0]],
                        side: t.FrontSide
                    }));
                    floor.position.set(-20 + (x * scale), UNITSIZE * 0.2, -30 + (y * scale));
                    scene.add(floor);

                    // Ceiling
                    var ceiling = new t.Mesh(geometry, new t.MeshBasicMaterial({
                        map: textures[levelTextures[currentLevel][2][0]],
                        side: t.FrontSide
                    }));
                    ceiling.position.set(-20 + (x * scale), UNITSIZE * 0.4, -30 + (y * scale));
                    scene.add(ceiling);
                    break;

                case 1:
                    // Walls
                    var wall = new t.Mesh(geometry, new t.MeshBasicMaterial({
                        map: textures[levelTextures[currentLevel][1][(levelTextures[currentLevel][1].length > 1) ? (Math.floor(Math.random() * levelTextures[currentLevel][1].length) + 1) - 1 : 0]],
                        side: t.FrontSide
                    }));
                    wall.position.set(-20 + (x * scale), UNITSIZE * 0.3, -30 + (y * scale));
                    scene.add(wall);
                    objects.push(wall);
                    break;
            }
        }
    }

    var radar = document.createElement('canvas');
    radar.id = "radar";
    radar.width = 302;
    radar.height = 152;
    document.body.appendChild(radar);
}

function update() {
    var dt = clock.getDelta();

    // Update the player passing through delta time
    player.update(dt);

    // will eventually work as pause
    if (key.down(key.ESC)) {
        document.pointerLockElement = null;
        controls.enabled = false;
        blocker.style.display = "box";
        key.reset(key.ESC);
    }

    controls.getObject().translateX(player.position.x * dt);
    controls.getObject().translateY(player.position.y * dt);
    controls.getObject().translateZ(player.position.z * dt);
}

function drawRadar(level) {
    var ctx = document.getElementById('radar').getContext('2d');

    document.getElementById('radar').style.visibility = 'visible';

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    for (var y = 0; y < level.length; y++) {
        for (var x = 0; x < level[0].length; x++) {
            switch (level[x][y]) {
                case 1:
                    // Walls
                    ctx.fillStyle = '#0000FF';
                    ctx.fillRect(x * 5, y * 5, 4, 4);
                    break;
            }
        }
    }

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(15 + (controls.getObject().position.x * 5) / level.length - 5, 15 + (controls.getObject().position.z * 5) / level.length, 4, 4);
}

function collides(vec, dist) {
    raycaster.setFromCamera(vec, camera);
    var intersects = raycaster.intersectObjects(objects);
    return (intersects.length > 0 && intersects[0].distance < dist) ? true : false;
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
            drawRadar(currentMap);
        }
    }
}

function animate() {
    stats.begin();

    // Update and render the game
    update();
    render();

    stats.end();

    // Tells the browser we wish to animate something and to repaint
    requestAnimationFrame(animate);
}

document.addEventListener('pointerlockchange', pointerlockchange, false);
document.addEventListener('mozpointerlockchange', pointerlockchange, false);
document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
document.addEventListener('click', function(event) {
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
    element.requestPointerLock()
    showGUI = true;
}, false);

init();
animate();