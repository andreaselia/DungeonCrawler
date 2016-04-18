/**
 * @author Andreas Elia / http://github.com/andreaselia/
 */

var Bullet = function() {
    this.velocity = new t.Vector3();
    this.speed = bulletInfo.speed;
    this.cube = null;
    this.timer = 0;
    this.maxAliveTime = bulletInfo.maxAliveTime;
    this.position = new t.Vector3();
    this.raycaster = new t.Raycaster();
    this.direction = new t.Vector3();
    this.colliding = false;

    /**
     * Initalizes the bullet elements
     */
    this.init = function() {
        // Get the current direction of the controls
        controls.getDirection(this.direction);

        // Set the raycaster from the position to the direction
        this.raycaster.set(controls.getObject().position, this.direction);

        // Set the rotation to the direction and normalize it
        this.rotation = this.raycaster.ray.direction;
        this.rotation.normalize();

        // Store the current position for reverting to this position upon colliding
        var storedPositionX = controls.getObject().position.x + this.rotation.x;
        var storedPositionY = 3;
        var storedPositionZ = controls.getObject().position.z + this.rotation.z;

        // Add the bullets cube
        this.cube = new t.Mesh(new t.CubeGeometry(0.1, 0.1, 0.1), new t.MeshLambertMaterial({
            map: bulletTexture
        }));

        // Set the bullets position
        this.cube.position.x = storedPositionX;
        this.cube.position.y = storedPositionY;
        this.cube.position.z = storedPositionZ;
    };

    /**
     * Handles any updating the bullet needs to do
     * @param  {Number} dt
     */
    this.update = function(dt) {
        // Move the bullet by it's direction
        this.cube.translateX(this.speed * this.rotation.x);
        this.cube.translateZ(this.speed * this.rotation.z);

        // Increase the bullets life timer
        this.timer++;

        // Loop through the map
        for (var x = 0; x < map.length; x++) {
            for (var z = 0; z < map[x].length; z++) {
                switch (map[x][z]) {
                    case Tile.WALL:
                    case Tile.GATE:
                        // Store a collision radius
                        var radius = 0.4;

                        // Variables used for checking collisions between the tiles around the bullet in radius
                        var minTileX = x - radius;
                        var maxTileX = x + radius;
                        var minTileZ = z - radius;
                        var maxTileZ = z + radius;

                        // Check the current position by the radius collision radius to check for collisions
                        if (minTileX <= this.cube.position.x && this.cube.position.x <= maxTileX && minTileZ <= this.cube.position.z && this.cube.position.z <= maxTileZ) {
                            // Set colliding to true
                            this.colliding = true;
                        }
                        break;
                }
            }
        }
    };
};
