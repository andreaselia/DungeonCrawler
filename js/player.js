var Player = function()
{
    this.cameraPosition = new t.Vector3();
    this.velocity = new t.Vector3();
    this.maxVelocity = 20;
    this.speed = 5;
    this.raycaster = new t.Raycaster();
    this.cube = null;

    this.update = function(dt)
    {
        // Forward movement
        if ((key.down(key.FORWARD) || key.down(key.ARROW_FORWARD)))
        {
            if (this.velocity.z > -this.maxVelocity)
            {
                this.velocity.z = -this.speed;
            }
        }

        // Backward movement
        else if ((key.down(key.BACK) || key.down(key.ARROW_BACK)))
        {
            if (this.velocity.z < this.maxVelocity)
            {
                this.velocity.z = this.speed;
            }
        }
        else
        {
            this.velocity.z = 0;
        }

        // Left movement
        if ((key.down(key.LEFT) || key.down(key.ARROW_LEFT)))
        {
            if (this.velocity.x > -this.maxVelocity)
            {
                this.velocity.x = -this.speed;
            }
        }

        // Right movement
        else if ((key.down(key.RIGHT) || key.down(key.ARROW_RIGHT)))
        {
            if (this.velocity.x < this.maxVelocity)
            {
                this.velocity.x = this.speed;
            }

        }
        else
        {
            this.velocity.x = 0;
        }
    };

    this.render = function(scene, camera) {};
};
