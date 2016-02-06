/**
 * @author mrdoob / http://mrdoob.com/
 * @author Andreas Elia / http://github.com/andreaselia/
 */

var Keyboard = function ( hand ) {

	this.leftHand = hand;

	this.movementSpeed = 1.0;
	this.autoForward = false;

	this.pressed = {};

	// WASD/Arrow Key = Movement
	this.FORWARD = ( this.leftHand ? 38 : 87 );
	this.BACKWARD = ( this.leftHand ? 40 : 83 );
	this.LEFT = ( this.leftHand ? 37 : 65 );
	this.RIGHT = ( this.leftHand ? 39 : 68 );

	// SPACE = Continue
	this.SPACE = 32;

	// ONE = Switch WASD/Arrow Keys
	this.ONE = 49;

	// ESC = Pause
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

		return function () {

			fn.apply( scope, arguments );

		};

	};

};