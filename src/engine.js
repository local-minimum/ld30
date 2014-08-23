"use strict";

function Mob()
{
    this.DEBUG = true;

    /*
     * Path of the patroling mob.
     */
    this.path = undefined;

    /*
     * Position in the path.
     */
    this.position = 0;
}

Mob.prototype = 
{
    /*
     * Get the current position of the mob.
     */
    "getPos": function()
    {
        if (this.DEBUG)
        {
            console.log("Get mob position");
            console.log(this.path[this.position][0]);
            console.log(this.path[this.position][1]);
            console.log(this.path[this.position][2]);
        }

        return this.path[this.position];
    },

    /*
     * Move mob to next position in the path.
     */
    "move": function()
    {
        this.position++;

        if (this.position == this.path.length)
        {
            this.position = 0;
        }

        if (this.DEBUG)
        {
            console.log("Move mob to next position on path");
            console.log(this.path[this.position][0]);
            console.log(this.path[this.position][1]);
            console.log(this.path[this.position][2]);
        }
    }
}

function Model()
{
    this.DEBUG = true;

    this.ready = false;

    /*
     * Three dimensional matrix, [layer][up-to-down][left-to-right],
     * describing the level paths.
     */
    this.level = undefined;

    /*
     * The player start position.
     */
    this.start = undefined;

    /*
     * The current player position.
     */
    this.player = undefined;

    /*
     * The goal position.
     */
    this.goal = undefined;

    /*
     * A list of mobs patroling the level.
     */
    this.mobs = [];

    this.onLevelCallback = undefined;
}

Model.prototype = 
{
    /*
     * Set up a new level from JSON data object.
     */
    "setLevel": function(lvlData)
    {
        if (!lvlData)
        {
            console.log("lvlData object is false in Model setLevel");
        }

        if (this.DEBUG)
        {
	    console.log("Setting up new level");
        }

        this.level = lvlData.level;
        this.start = lvlData.start;
        this.player = lvlData.start;
        this.goal = lvlData.goal;

        // Create the mobs
        for (var i in lvlData.enemies)
        {
            if (this.DEBUG)
            {
	        console.log(lvlData.enemies[i].type);
	        console.log(lvlData.enemies[i].layer);
	        console.log(lvlData.enemies[i].path);
            }

            var mob = new Mob();

            var path = lvlData.enemies[i].path;

            // Convert bounce path to loop path
            if (lvlData.enemies[i].type == "Bounce")
            {
                var tmp = path.slice(0);
                tmp.pop();
                tmp = tmp.reverse();
                tmp.pop();
                path = path.concat(tmp);
            }


            // Add layer to coordinates.
            mob.path = path.map(function(pos)
            {
                return [lvlData.enemies[i].layer].concat(pos);
            });

            this.mobs.push(mob);
        }

        if (this.DEBUG)
        {
      	    console.log("Level data");
	    console.log(lvlData);
            console.log(this.level);
            console.log(this.player);
            console.log(this.goal);
            console.log(this.mobs);
        }

        if (this.onLevelCallback)
        {
	    this.onLevelCallback();
        }

        this.ready = true;
    },

    /*
     * Restart level by resetting player and mob positions.
     */
    "restart": function()
    {
        this.player = this.start;

        for (var i in this.mobs)
        {
            this.mobs[i].position = 0;
        }

        if (this.DEBUG)
        {
	    console.log("Restarting level");
            console.log(this.level);
            console.log(this.player);
            console.log(this.goal);
            console.log(this.mobs);
        }
    },

    /*
     * Move player up one layer, regardless of validity.
     */
    "ascend": function()
    {
        this.player = [this.player[0] + 1, this.player[1], this.player[2]];

        if (this.DEBUG)
        {
	    console.log("Moving player up one layer");
            console.log(this.player[0]);
            console.log(this.player[1]);
            console.log(this.player[2]);
        }
    },

    /*
     * Move player down one layer, regardless of validity.
     */
    "descend": function()
    {
        this.player = [this.player[0] - 1, this.player[1], this.player[2]];

        if (this.DEBUG)
        {
	    console.log("Moving player down one layer");
            console.log(this.player[0]);
            console.log(this.player[1]);
            console.log(this.player[2]);
        }
    },

    /*
     * Move player to the right, regardless of validity.
     */
    "right": function()
    {
        this.player = [this.player[0], this.player[1], this.player[2] + 1];

        if (this.DEBUG)
        {
	    console.log("Moving player to the right");
            console.log(this.player[0]);
            console.log(this.player[1]);
            console.log(this.player[2]);
        }
    },

    /*
     * Move player to the left, regardless of validity.
     */
    "left": function()
    {
        this.player = [this.player[0], this.player[1], this.player[2] - 1];

        if (this.DEBUG)
        {
	    console.log("Moving player to the left");
            console.log(this.player[0]);
            console.log(this.player[1]);
            console.log(this.player[2]);
        }
    },

    /*
     * Move player upwards, regardless of validity.
     */
    "up": function()
    {
        this.player = [this.player[0], this.player[1] + 1, this.player[2]];

        if (this.DEBUG)
        {
	    console.log("Moving player upwards");
            console.log(this.player[0]);
            console.log(this.player[1]);
            console.log(this.player[2]);
        }
    },

    /*
     * Move player downwards, regardless of validity.
     */
    "down": function()
    {
        this.player = [this.player[0], this.player[1] - 1, this.player[2]];

        if (this.DEBUG)
        {
	    console.log("Moving player downwards");
            console.log(this.player[0]);
            console.log(this.player[1]);
            console.log(this.player[2]);
        }
    },

    /*
     * Check if player position is valid.
     */
    "isValidPosition": function()
    {
        if (this.DEBUG)
        {
	    console.log("Checking if player position is valid");
            console.log(this.player[0]);
            console.log(this.player[1]);
            console.log(this.player[2]);
        }

        // First check within index bounds, then check player standing on tile.
        return this.player[0] >= 0 && this.player[1] >= 0 && this.player[2] >= 0
                && this.player[0] < this.level.length
                && this.player[1] < this.level[0].length
                && this.player[2] < this.level[0][0].length
                && this.level[this.player[0], this.player[1],
                        this.player[2]] != 0;
    },

    /*
     * Check if mob caught player.
     */
    "isCaught": function()
    {
        if (this.DEBUG)
        {
            console.log("Checking if player is caught");
        }

        for (var i in this.mobs)
        {
            if (this.player[0] == this.mobs[i].getPos()[0]
                    && this.player[1] == this.mobs[i].getPos()[1]
                    && this.player[2] == this.mobs[i].getPos()[2])
            {
                return true;
            }
        }

        return false;
    },

    /*
     * The win condition of the level.
     */
    "isWinning": function()
    {
        return this.player[0] == this.goal[0] && this.player[1] == this.goal[1]
                this.player[2] == this.goal[2];
    },

    /*
     * Moves the mobs to their next position on their paths.
     */
    "moveMobs": function()
    {
        if (this.DEBUG)
        {
            console.log("Move the mobs");
        }
        
        for (var i in this.mobs)
        {
            this.mobs[i].move();
        }
    },

    "activeLayers": function()
    {
        if (this.DEBUG)
        {
            console.log("Get active layers");
        }

        return [this.level[0][this.player[1]][this.player[2]],
                this.level[1][this.player[1]][this.player[2]],
                this.level[2][this.player[1]][this.player[2]]];
    }
}

var MODEL = new Model();

/*
 * RESOURCES TO BE LOADED
 */

var DATA = {
	"_loaded" : false,
	"_parts": 0,
	"_total": 3,
	"imgs" : new Array(),

};

DATA.loaded = function() {
	if (!DATA._loaded) {
		DATA._loaded = DATA.loading() >= 1;
	}
	return DATA._loaded;
}

DATA.loading = function() {
	return DATA._parts / DATA._total;
}

/*
 * ENGINE
 */

function Engine() {
	this.curLevel = 0;	
	this.maxLevel = 1;
	this.inMenus = false;
	this.knownActiveLayers = undefined;
	this.offsetX;
	this.offsetY;
	this.drawLayers = new Array();
	this.stage = undefined;
}

Engine.prototype = {
	
	"loadLevel": function(lvl) {
		MODEL.ready = false;
		MODEL.onLevelCallback = $.proxy(this, "initLevel");
		$.getJSON("data/lvl" + lvl + ".json", function(response) {
			MODEL.setLevel(response);
		}).error(function() { alert("Could not load level " + lvl); });

	},

	"showMenu": function() {
		this.inMenus = true;

	},

	"nextLevel": function() {
		if (this.curLevel < this.maxLevel)
			this.curLevel ++;

		this.loadLevel(this.curLevel);
	},

	"loadImages" : function(imageArray) {
		for (var i=0; i<imageArray.length; i++) {
			var imageObj = new Image();
			imageObj.onload = function() {
				DATA._parts++;
			}
			DATA.imgs[imageArray[i][0]] = new Kinetic.Image( {
				x: 0,
				y: 0,
				image: imageObj,
				draggable: false});
			imageObj.src = imageArray[i][1]

		}
	},

	"initLevel" : function() {

		if (!DATA.loaded) {
			return;
		}

		for (var i=0; i<MODEL.level.length; i++) {
			var addLayer = false;
			if (this.drawLayers.length <= i) {
				this.drawLayers[i] = new Kinetic.Layer();
				this.drawLayers[i].clearBeforeDraw = false;
				this.drawLayers[i].height = MODEL.level[i].length * 42;
				this.drawLayers[i].width = MODEL.level[i][0].length * 64;
				addLayer = true;
			} else {
				//TODO: clear layer
			}
				
			for (var y=0; y<MODEL.level[i].length; y++) {
				for (var x=0; x<MODEL.level[i][y].length; x++) {
					if (MODEL.level[i][y][x] == 1) {
						this.drawLayers[i].add(DATA.imgs[i].clone({
							x: x*64, y:y*42}));
					}
				}
			}

			if (addLayer)
				this.stage.add(this.drawLayers[i]);
		}

		if (!this.movables) {
			this.movables = new Kinetic.Layer();
			this.stage.add(this.movables);
		} else {
			//TODO: clear layer
		}
		this.movables.add(DATA.imgs["player"].clone({
			x: MODEL.player[2] * 64, y: MODEL.player[1] * 42}));
		for (var i=0; i < MODEL.mobs.length; i++) {
			var mPos = MODEL.mobs[i].getPos();
			this.movables.add(DATA.imgs["mob"].clone({
				x: mPos[2]*64, y: mPos[1] * 42}));
			};
		
	},

	"drawLoading": function() {
		//this.ctx.fillRect(10, 10, 300 * DATA.loading(), 30);
	},

	"drawMenu": function() {

	},

	"drawLevel": function() {
		if (!MODEL.ready)
			return;

		for (var i=0; i<this.drawLayers.length; i++)
			this.drawLayers[i].draw()
	},

	"draw" : function() {
		if (DATA.loaded) {
			if (this.inMenus)
				this.drawMenu();
			else
				this.drawLevel();

		} else {
			this.drawLoading();
		}
	},

	"update": function() {
		if (DATA.loaded) {
			if (this.inMenus) {

			} else {

				if (MODEL.ready) {
					MODEL.moveMobs();

					this.offsetY = (MODEL.height - MODEL.player[1]) * 42 - 200;
					this.offsetX = (MODEL.width - MODEL.player[0]) * 64 - 200;
					var aL = MODEL.activeLayers();
					
					if (this.knownLayers != MODEL.activeLayers) {

					}
					for (var i=0; i<this.drawLayers.length; i++) {
						this.drawLayers[i].offsetX(-20);
						this.drawLayers[i].offsetY(250);
						this.drawLayers[i].opacity(aL[i] * 0.7 + 0.3);
					}
					
				}
			}
		} else {
			
		}
	},

	"start" : function() {
		this.stage = new Kinetic.Stage({
			container: 'game',
			width: 400,
			height: 400
		});

		var staticLayer = new Kinetic.Layer();
		this.stage.add(staticLayer);

		this.loadImages([
				//DATA-key, src, width, heigh
				[0, "img/c0.png"],
				[1, "img/c1.png"],
				[2, "img/c2.png"],
				["player", "img/player.png"],
				["mob", "img/mob.png"]]);
		
		//TODO: A hack to load first level
		var f1 = $.proxy(this, "nextLevel");
		setTimeout(f1, 200)

		//Setting up callbacks
		var f = $.proxy(this, "draw");
		window.setInterval(f, 31);
		var f2 = $.proxy(this, "update");
		window.setInterval(f2, 31);

	}
}

$.ajaxSetup({beforeSend: function(xhr){
  if (xhr.overrideMimeType)
  {
    xhr.overrideMimeType("application/json");
  }
}
});

var e = new Engine();
e.start();
