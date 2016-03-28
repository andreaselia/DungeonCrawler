/**
 * @author Andreas Elia / http://github.com/andreaselia/
 * @author mrdoob / http://mrdoob.com/
 */

var Keyboard = function() {
    // Keys being pressed are stored in this array
    this.pressed = {};

    // WASD Keys
    this.FORWARD = 38;
    this.BACK = 83;
    this.LEFT = 37;
    this.RIGHT = 39;

    // Arrow Keys
    this.ARROW_FORWARD = 87;
    this.ARROW_BACK = 40;
    this.ARROW_LEFT = 65;
    this.ARROW_RIGHT = 68;

    this.down = function(keyCode) {
        return this.pressed[keyCode];
    };

    this.reset = function(keyCode) {
        delete this.pressed[keyCode];
    };

    this.onKeyDown = function(event) {
        this.pressed[event.keyCode] = true;
    };

    this.onKeyUp = function(event) {
        delete this.pressed[event.keyCode];
    };

    function preventDefaults(event) {
        event.preventDefault();
    };

    function bind(scope, fn) {
        return function() {
            fn.apply(scope, arguments);
        };
    };

    document.addEventListener('contextmenu', preventDefaults, false);
    document.addEventListener('keydown', bind(this, this.onKeyDown), false);
    document.addEventListener('keyup', bind(this, this.onKeyUp), false);
};
