/**
 * @author Andreas Elia / http://github.com/andreaselia/
 * @credit steveOw / http://stackoverflow.com/users/2748766/steveow
 */

var Player = function() {
    this.cameraPosition = new t.Vector3();
    this.velocity = new t.Vector3();
    this.maxVelocity = 20;
    this.speed = 5;
    this.cube = null;

    this.init = function() {
        // Add the players cube
        this.cube = new t.Mesh(new t.CubeGeometry(0.02, 0.02, 0.02), new t.MeshLambertMaterial());

        // Set the cube visibility to false
        this.cube.visible = false;
    };

    this.update = function(dt) {
        if ((key.down(key.FORWARD) || key.down(key.ARROW_FORWARD))) {
            // Forward movement
            if (this.velocity.z > -this.maxVelocity) {
                this.velocity.z = -this.speed;
            }
        }
        else if ((key.down(key.BACK) || key.down(key.ARROW_BACK))) {
            // Backward movement
            if (this.velocity.z < this.maxVelocity) {
                this.velocity.z = this.speed;
            }
        }
        else {
            this.velocity.z = 0;
        }

        if ((key.down(key.LEFT) || key.down(key.ARROW_LEFT))) {
            // Left movement
            if (this.velocity.x > -this.maxVelocity) {
                this.velocity.x = -this.speed;
            }
        }
        else if ((key.down(key.RIGHT) || key.down(key.ARROW_RIGHT))) {
            // Right movement
            if (this.velocity.x < this.maxVelocity) {
                this.velocity.x = this.speed;
            }
        }
        else {
            this.velocity.x = 0;
        }

        // Store the current position for reverting to this position upon colliding
        var storedPositionX = controls.getObject().position.x;
        var storedPositionY = controls.getObject().position.y;
        var storedPositionZ = controls.getObject().position.z;

        // How much the position should nudge
        var maxNudge = 0.2;

        // Translate by the nudge in each direction
        controls.getObject().translateX(Math.min(this.velocity.x * dt, maxNudge));
        controls.getObject().translateY(Math.min(this.velocity.y * dt, maxNudge));
        controls.getObject().translateZ(Math.min(this.velocity.z * dt, maxNudge));

        // Store the new current position after translate
        var currentPositionX = controls.getObject().position.x;
        var currentPositionZ = controls.getObject().position.z;

        // Store a colliding boolean
        var colliding = false;

        // Loop through the map
        for (var x = 0; x < map.length; x++) {
            for (var z = 0; z < map[x].length; z++) {
                switch (map[x][z]) {
                    case Tile.WALL:
                    case Tile.GATE:
                        // If the current tile is a wall or gate store the real world position
                        var tileX = x * scale;
                        var tileZ = z * scale;

                        // Store a collision radius
                        var radius = 0.2;

                        // Variables used for checking collisions between the tiles around the player in radius
                        var minTileX = tileX - scale / 2 - radius;
                        var maxTileX = tileX + scale / 2 + radius;
                        var minTileZ = tileZ - scale / 2 - radius;
                        var maxTileZ = tileZ + scale / 2 + radius;

                        // Check the current position by the radius collision radius to check for collisions
                        if (minTileX <= currentPositionX && currentPositionX <= maxTileX && minTileZ <= currentPositionZ && currentPositionZ <= maxTileZ) {
                            // Reset the velocity to 0
                            this.velocity.set(0, 0, 0);

                            // Set colliding to true
                            colliding = true;
                        }
                        break;
                }
            }
        }

        // If colliding with a wall or gate
        if (colliding) {
            // The player collided so the position is set back to the position before colliding
            controls.getObject().position.set(storedPositionX, storedPositionY, storedPositionZ);

            // Position has been set back so set colliding to false
            colliding = false;
        }

        // The cubes position to the controls position since the cube is used for colliding
        this.cube.position.set(controls.getObject().position.x, controls.getObject().position.y, controls.getObject().position.z);

        // Reset the camera position
        camera.position.set(0, 0, 0);
    };
};
