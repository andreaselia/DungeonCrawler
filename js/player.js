/**
 * @author Andreas Elia / http://github.com/andreaselia/
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
        this.cube.visible = false;
    };

    this.update = function(dt) {
        if ((key.down(key.FORWARD) || key.down(key.ARROW_FORWARD))) {
            // Forward movement
            if (this.velocity.z > -this.maxVelocity) {
                this.velocity.z = -this.speed;
            }
        } else if ((key.down(key.BACK) || key.down(key.ARROW_BACK))) {
            // Backward movement
            if (this.velocity.z < this.maxVelocity) {
                this.velocity.z = this.speed;
            }
        } else {
            this.velocity.z = 0;
        }

        if ((key.down(key.LEFT) || key.down(key.ARROW_LEFT))) {
            // Left movement
            if (this.velocity.x > -this.maxVelocity) {
                this.velocity.x = -this.speed;
            }
        } else if ((key.down(key.RIGHT) || key.down(key.ARROW_RIGHT))) {
            // Right movement
            if (this.velocity.x < this.maxVelocity) {
                this.velocity.x = this.speed;
            }
        } else {
            this.velocity.x = 0;
        }

        var storedPositionX = controls.getObject().position.x;
        var storedPositionY = controls.getObject().position.y;
        var storedPositionZ = controls.getObject().position.z;

        var maxNudge = 0.2;

        var nudgeX = Math.min(this.velocity.x * dt, maxNudge);
        var nudgeY = Math.min(this.velocity.y * dt, maxNudge);
        var nudgeZ = Math.min(this.velocity.z * dt, maxNudge);

        controls.getObject().translateX(nudgeX);
        controls.getObject().translateY(nudgeY);
        controls.getObject().translateZ(nudgeZ);

        var currentPositionX = controls.getObject().position.x;
        var currentPositionZ = controls.getObject().position.z;

        var colliding = false;

        for (var x = 0; x < map.length; x++) {
            for (var z = 0; z < map[x].length; z++) {
                switch (map[x][z]) {
                    case Tile.WALL:
                    case Tile.GATE:
                        var tileX = x * scale;
                        var tileZ = z * scale;

                        var radius = 0.2;

                        var minTileX = tileX - scale / 2 - radius;
                        var maxTileX = tileX + scale / 2 + radius;
                        var minTileZ = tileZ - scale / 2 - radius;
                        var maxTileZ = tileZ + scale / 2 + radius;

                        if (minTileX <= currentPositionX && currentPositionX <= maxTileX && minTileZ <= currentPositionZ && currentPositionZ <= maxTileZ) {
                            colliding = true;
                            this.velocity.x = 0;
                            this.velocity.z = 0;
                        }
                        break;
                }
            }
        }

        if (colliding) {
            // The player collided so the position is set back to the position before colliding
            controls.getObject().position.set(storedPositionX, storedPositionY, storedPositionZ);

            // Position has been set back so set colliding to false
            colliding = false;
        }

        this.cube.position.set(controls.getObject().position.x, controls.getObject().position.y, controls.getObject().position.z);
        camera.position.set(0, 0, 0);
    };

    this.render = function(scene, camera) {};
};
