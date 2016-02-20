var Player = function() {

    this.cameraPosition = new t.Vector3();
    this.position = new t.Vector3();
    this.moveSpeed = 20;
    this.speedIncrease = 100;

    this.init = function() {
    };

    this.update = function(dt) {
        if ((key.down(key.FORWARD) || key.down(key.ARROW_FORWARD)) && !this.collides(new t.Vector3(0, 0, -1), 2)) {
            if (this.position.z > -this.moveSpeed) {
                this.position.z -= this.speedIncrease * dt;
            }
        } else if ((key.down(key.BACK) || key.down(key.ARROW_BACK)) && !this.collides(new t.Vector3(0, 0, 1), 2)) {
            if (this.position.z < this.moveSpeed) {
                this.position.z += this.speedIncrease * dt;
            }
        } else {
            this.position.z = 0;
        }

        if ((key.down(key.LEFT) || key.down(key.ARROW_LEFT)) && !this.collides(new t.Vector3(-1, 0, 0), 2)) {
            if (this.position.x > -this.moveSpeed) {
                this.position.x -= this.speedIncrease * dt;
            }
        } else if ((key.down(key.RIGHT) || key.down(key.ARROW_RIGHT)) && !this.collides(new t.Vector3(1, 0, 0), 2)) {
            if (this.position.x < this.moveSpeed) {
                this.position.x += this.speedIncrease * dt;
            }
        } else {
            this.position.x = 0;
        }
    };

    this.render = function(scene, camera) {};

    this.collides = function(vec, dist) {
        raycaster.setFromCamera(vec, camera);
        var intersects = raycaster.intersectObjects(objects);
        return (intersects.length > 0 && intersects[0].distance < dist) ? true : false;
    };

};
