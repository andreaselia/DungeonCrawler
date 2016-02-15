/**
 * @author mrdoob / http://mrdoob.com/
 * @author Andreas Elia / http://github.com/andreaselia/
 */

var Keyboard = function () {

	this.movementSpeed = 1.0;
	this.autoForward = false;

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

	// Space Key
	this.SPACE = 32;

	// Escape Key
	this.PAUSE = 27;

	this.down = function( keyCode ) {
		return this.pressed[ keyCode ];
	};

	this.reset = function( keyCode ) {
		delete this.pressed[ keyCode ];
	};

	this.onKeyDown = function( event ) {
		this.pressed[ event.keyCode ] = true;
	};

	this.onKeyUp = function( event ) {
		delete this.pressed[ event.keyCode ];
	};

	document.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	document.addEventListener( 'keydown', bind( this, this.onKeyDown ), false );
	document.addEventListener( 'keyup', bind( this, this.onKeyUp ), false );

	function bind( scope, fn ) {
		return function () { fn.apply( scope, arguments ); };
	};

};