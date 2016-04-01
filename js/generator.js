/**
 * @author Andreas Elia / http://github.com/andreaselia/
 * @credit Nick Gravelyn / https://github.com/nickgravelyn/
 */

/**
 * Handles all the important stuff for generating a dungeon
 * @param  {Number} size
 * @param  {Number} roomMinSize
 * @param  {Number} roomMaxSize
 * @param  {Number} maxRoomCount
 * @param  {Number} roomIterations
 */
var DungeonGenerator = function(size, roomMinSize, roomMaxSize, maxRoomCount, roomIterations) {
    this.size = size;

    this.roomInfo = {
        minSize: roomMinSize,
        maxSize: roomMaxSize,
        maxCount: maxRoomCount,
        iterations: roomIterations
    };

    this.rooms = [];
    this.roomList = [];

    /**
     * Initalize and setup the initial rooms and spawn position
     */
    this.init = function() {
        // Setup the arrays so they are two dimensional
        for (var x = 0; x < this.size; x++) {
            var row = [];

            // Both for loops go through the size of the room
            for (var y = 0; y < this.size; y++) {
                // Push an array to the row and make it two dimensional
                row.push([]);
            }

            // At the row to the list of room tiles array
            this.roomList.push(row);
        }

        // Start with creating an initial randomly generated room
        var room = this.createRoom();

        // Add the first room to the array
        this.addRoom(room);

        // Multiply the maximum number of rooms by the number of iterations
        var iterates = this.roomInfo.maxCount;

        // Generate as many rooms as possible before the iterations reaches it's limit or there is no more space to spawn rooms
        while ((this.roomInfo.maxCount <= 0 || this.rooms.length < this.roomInfo.maxCount) && iterates-- > 0) {
            // Generate an initial random room
            var room = this.createRoom();

            // Loop through a specific set of iterations to try to add a room
            for (var i = 0; i < this.roomInfo.iterations; i++) {
                // Try to find a random room from the list of rooms to attatch room1 to
                var room2 = this.rooms[random(0, this.rooms.length - 1)];

                // Store a random nunebr based on the numbers of the directions
                var direction = random(Direction.NORTH, Direction.WEST + 1);

                // The direction is north so we move room closer to room2
                if (direction == Direction.NORTH) {
                    room.x = random(room2.x - room2.width + 3, room2.x + room2.width - 2);
                    room.y = room2.y - room2.height + 1;
                }
                // The direction is east so we move room closer to room2
                else if (direction == Direction.EAST) {
                    room.x = room2.x + room2.width - 1;
                    room.y = random(room2.y - room2.height + 3, room2.y + room2.height - 2);
                }
                // The direction is south so we move room closer to room2
                else if (direction == Direction.SOUTH) {
                    room.x = random(room2.x - room2.width + 3, room2.x + room2.width - 2);
                    room.y = room2.y + room2.height - 1;
                }
                // The direction is west so we move room closer to room2
                else if (direction == Direction.WEST) {
                    room.x = room2.x - room2.width + 1;
                    room.y = random(room2.y - room2.height + 3, room2.y + room2.height - 2);
                }

                // Check to see if the add room was returned true and added
                if (this.addRoom(room)) {
                    // Add the gate since the room was added
                    this.addGate(this.getGateLocation(room, room2));

                    // Break the loop
                    break;
                }
            }
        }

        // Loop through all of the rooms
        for (var i = 0; i < this.rooms.length; i++) {
            // Store the current room being checked
            var room = this.rooms[i];

            // Store the possibly connected rooms in an array
            var connectedRooms = [];

            // Loop thorugh for possibly connected rooms
            for (var x = room.x + 1; x < room.x + room.width - 1; x++) {
                for (var y = room.y + 1; y < room.y + room.height - 1; y++) {
                    this.checkRoomList(x, room.y, room, connectedRooms);
                    this.checkRoomList(x, room.y + room.height - 1, room, connectedRooms);

                    this.checkRoomList(room.x, y, room, connectedRooms);
                    this.checkRoomList(room.x + room.width - 1, y, room, connectedRooms);
                }
            }

            // Loop through all potential targets for connecting rooms
            for (var j = 0; j < connectedRooms.length; j++) {
                // Check to see if the rooms are already connected by gates and if not add one with a 1/4 - 25% change
                if (!this.checkForAlreadyConnectedRooms(this.rooms[i], connectedRooms[j]) && Math.random() < 0.25) {
                    this.addGate(this.getGateLocation(this.rooms[i], connectedRooms[j]));
                }
            }
        }

        // Search each room for a spawn location
        var room = null;

        // If the room variable is null then assign the room variable a random room
        if (room == null) {
            room = this.rooms[random(0, this.rooms.length - 1)];
        }
        // Else loop through possible gate locations array whilst it is greater than 1
        else {
            // While the length of the array length is greater than 1
            while (room.getGateLocations().length > 1) {
                // Set the room variable to a random room from the array
                room = this.rooms[random(0, this.rooms.length - 1)];
            }
        }

        // An array to store all possible spawn points
        var possibleSpawnPoints = [];

        // Loop through the size of the room
        for (var x = 1; x < room.width - 2; x++) {
            for (var y = 1; y < room.height - 2; y++) {
                // If the current tile being checked is floor
                if (room.tiles[x][y] == Tile.FLOOR) {
                    // Add the point to the possible spawn points array
                    possibleSpawnPoints.push({
                        x: x,
                        y: y
                    });
                }
            }
        }

        // Select a random point from the spawn points array
        var spawnPosition = possibleSpawnPoints[random(0, possibleSpawnPoints.length - 1)];

        // Set the spawn position tile to a spawn tile
        room.tiles[spawnPosition.x][spawnPosition.y] = Tile.SPAWN;
    };

    /**
     * Returns an output of all the rooms tiles to be used in-game
     * @return {Array}
     */
    this.getOutput = function() {
        // An array to store all tiles on the map
        var output = [];

        // Loop through the map size
        for (var x = 0; x < this.size; x++) {
            // Make the tiles array two dimensional
            output[x] = [];
            for (var y = 0; y < this.size; y++) {
                // Set all of the tiles to floor by default
                output[x][y] = Tile.FLOOR;
            }
        }

        // Fill the rooms array with the data to populate each rooms tiles
        for (var i = 0; i < this.rooms.length; i++) {
            var room = this.rooms[i];

            // Loop through each room width and height
            for (var x = 0; x < room.width; x++) {
                for (var y = 0; y < room.height; y++) {
                    // Replicate all of the rooms tiles to the array here to be output
                    output[x + room.x][y + room.y] = room.tiles[x][y];
                }
            }
        }

        // Return the overall map array including all room tiles
        return output;
    };

    /**
     * Checks to see if rooms are already connected and returns the appropriate boolean
     * @param  {Room} room1
     * @param  {Room} room2
     * @return {Boolean}
     */
    this.checkForAlreadyConnectedRooms = function(room1, room2) {
        // Get the gate locations for the first room
        var gates = room1.getGateLocations();

        // Loop through all possible gate locations
        for (var i = 0; i < gates.length; i++) {
            var gate = gates[i];

            // Place the gate at the position between rooms
            gate.x += room1.x - room2.x;
            gate.y += room1.y - room2.y;

            // Check to see if the rooms are at the right position
            if (!(gate.x < 0 || gate.x > room2.width - 1 || gate.y < 0 || gate.y > room2.height - 1) && room2.tiles[gate.x][gate.y] == Tile.GATE) {
                return true;
            }
        }

        // Rooms are not at the right position so return false
        return false;
    };

    /**
     * Check for possible room connections
     * @param  {Number} x
     * @param  {Number} y
     * @param  {Room} room
     * @param  {Array} connectedRooms
     */
    this.checkRoomList = function(x, y, room, connectedRooms) {
        // Store the rooms at the given position in an array
        var rooms = this.roomList[x][y];

        // Loop through array of rooms
        for (var i = 0; i < rooms.length; i++) {
            // Store the current room being checked index number
            var currentIndex = connectedRooms.indexOf(rooms[i]);

            // Check to see if the room is the one passed as a parameter and don't check it
            if (rooms[i] != room && currentIndex < 0) {
                // Ensure the current position is not a corner as it would be inaccessible
                if ((x - rooms[i].x > 0 && x - rooms[i].x < rooms[i].width - 1) || (y - rooms[i].y > 0 && y - rooms[i].y < rooms[i].height - 1)) {
                    // Add the current room being checked to the connected rooms array
                    connectedRooms.push(rooms[i]);
                }
            }
        }
    };

    /**
     * Returns an array of rooms that may be connected to the parameter room
     * @param  {Room} room
     * @return {Array} connectedRooms
     */
    this.getPotentiallyConnectedRooms = function(room) {
        // Store the possibly connected rooms in an array
        var connectedRooms = [];

        // Check the X for possibly connected rooms
        for (var x = room.x + 1; x < room.x + room.width - 1; x++) {
            // Check the Y for possibly connected rooms
            for (var y = room.y + 1; y < room.y + room.height - 1; y++) {
                this.checkRoomList(x, room.y, room, connectedRooms);
                this.checkRoomList(x, room.y + room.height - 1, room, connectedRooms);

                this.checkRoomList(room.x, y, room, connectedRooms);
                this.checkRoomList(room.x + room.width - 1, y, room, connectedRooms);
            }
        }

        // Return an array of connected rooms
        return connectedRooms;
    };

    /**
     * Returns a position for a gate location between the two given rooms
     * @param  {Room} room1
     * @param  {Room} room2
     * @return {Array} gatePosition
     */
    this.getGateLocation = function(room1, room2) {
        // Use the specified direction to find a random spot on the wall to put the gate
        var direction = -1;

        // Set the direction to north because the rooms are close enough for a gate on the west
        if (room1.y == room2.y - room1.height + 1) {
            direction = Direction.NORTH;
        }
        // Set the direction to east because the rooms are close enough for a gate on the west
        else if (room1.x == room2.x + room2.width - 1) {
            direction = Direction.EAST;
        }
        // Set the direction to south because the rooms are close enough for a gate on the west
        else if (room1.y == room2.y + room2.height - 1) {
            direction = Direction.SOUTH;
        }
        // Set the direction to west because the rooms are close enough for a gate on the west
        else if (room1.x == room2.x - room1.width + 1) {
            direction = Direction.WEST;
        }

        // To store the gate position parameters
        var gatePosition = {
            x: -1,
            y: -1
        };

        // The direction is north so set the gate position to a spot on this wall
        if (direction == Direction.NORTH) {
            gatePosition.x = random(
                Math.max(room1.x, room2.x) + 1,
                Math.min(room1.x + room1.width, room2.x + room2.width) - 1
            );
            gatePosition.y = room2.y;
        }
        // The direction is east so set the gate position to a spot on this wall
        else if (direction == Direction.EAST) {
            gatePosition.x = room1.x;
            gatePosition.y = random(
                Math.max(room1.y, room2.y) + 1,
                Math.min(room1.y + room1.height, room2.y + room2.height) - 1
            );
        }
        // The direction is south so set the gate position to a spot on this wall
        else if (direction == Direction.SOUTH) {
            gatePosition.x = random(
                Math.max(room1.x, room2.x) + 1,
                Math.min(room1.x + room1.width, room2.x + room2.width) - 1
            );
            gatePosition.y = room1.y;
        }
        // The direction is west so set the gate position to a spot on this wall
        else if (direction == Direction.WEST) {
            gatePosition.x = room2.x;
            gatePosition.y = random(
                Math.max(room1.y, room2.y) + 1,
                Math.min(room1.y + room1.height, room2.y + room2.height) - 1
            );
        }

        // Return the gate position
        return gatePosition;
    };

    /**
     * Check to see if the two given rooms intersect each other
     * @param  {Room} room1
     * @param  {Room} room2
     * @return {Boolean}
     */
    this.checkRoomIntersects = function(room1, room2) {
        // Return a boolean absed on if the given parameter rooms are intersecting
        return !(room1.x + room1.width <= room2.x + 1 || room1.x >= room2.x + room2.width - 1 || room1.y + room1.height <= room2.y + 1 || room1.y >= room2.y + room2.height - 1);
    };

    /**
     * For adding rooms to the map
     * @param  {Room} room
     * @return {Boolean}
     */
    this.addRoom = function(room) {
        // Check to see if the room will fit in the position it wants to be created
        if (room.x < 0 || room.x + room.width > this.size - 1 || room.y < 0 || room.y + room.height > this.size - 1) {
            return false;
        }

        // Check to see if it will intersect any other rooms
        for (var i = 0; i < this.rooms.length; i++) {
            var room2 = this.rooms[i];
            if (this.checkRoomIntersects(room, room2)) {
                return false;
            }
        }

        // Add the current room to the rooms list
        this.rooms.push(room);

        // Update the room list of tiles to notify it of the new room
        for (var x = room.x; x < room.x + room.width; x++) {
            for (var y = room.y; y < room.y + room.height; y++) {
                var list = this.roomList[x][y];
                list.push(room);
                this.roomList[x][y] = list;
            }
        }

        // Return true because the room was added without issues
        return true;
    };

    /**
     * Add a gate at the specified position
     * @param  {Array} gatePosition
     */
    this.addGate = function(gatePosition) {
        if (gatePosition.x != -1 && gatePosition.y != -1) {
            // get all the rooms at the location of the gate
            var rooms = this.roomList[gatePosition.x][gatePosition.y];

            for (var i = 0; i < rooms.length; i++) {
                var room = rooms[i];

                // convert the gate position from world space to room space
                var x = gatePosition.x - room.x;
                var y = gatePosition.y - room.y;

                if (x != -1 && y != -1) {
                    // set the tile to be a gate
                    room.tiles[x][y] = Tile.GATE;
                }
            }
        }
    };

    /**
     * Create a randomly sized room
     * @return {Room}
     */
    this.createRoom = function() {
        // Return the newly created room based on the min and max room size
        return new Room(random(this.roomInfo.minSize, this.roomInfo.maxSize), random(this.roomInfo.minSize, this.roomInfo.maxSize)).init();
    };
};

/**
 * Room handles the storage of data for each room
 * @param  {Number} width
 * @param  {Number} height
 */
var Room = function(width, height) {
    this.width = width;
    this.height = height;
    this.x = 0;
    this.y = 0;

    this.tiles = [];

    /**
     * Initalize the room
     * @return {Room}
     */
    this.init = function() {
        // Loop through all of the room tiles
        for (var x = 0; x < this.width; x++) {
            // Create an array to store the current row of tiles
            var row = [];

            for (var y = 0; y < this.height; y++) {
                // If the current tile is an edge tile then make it a wall tile
                if (x == 0 || x == this.width - 1 || y == 0 || y == this.height - 1) {
                    // Push the wall tile to the row array
                    row.push(Tile.WALL);
                }
                // The current tile isn't an edge so make it a floor tile
                else {
                    // Push the floor tile to the row array
                    row.push(Tile.FLOOR);
                }
            }

            // Push the current row to the tiles array
            this.tiles.push(row);
        }

        return this;
    };

    /**
     * Returns a list of gate locations
     * @return {Array}
     */
    this.getGateLocations = function() {
        // Array to store gate locations
        var gates = [];

        // Loop through all of the room tiles
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                // If the current tile is a gate
                if (this.tiles[x][y] == Tile.GATE) {
                    // Add the current tile position to the gates array
                    gates.push({
                        x: x,
                        y: y
                    });
                }
            }
        }

        // Return the array of gates
        return gates;
    };
};
