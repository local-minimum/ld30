"use strict";

function Mob()
{
    this.DEBUG = true;

    this.path = undefined;
    this.position = 0;
}

Mob.prototype = 
{
    "getPos": function()
    {
        if (this.DEBUG)
        {
            console.log("get postion");
        }

        return this.path[this.position];
    },

    "move": function()
    {
        if (this.DEBUG)
        {
            console.log("move mob");
        }

        this.position++;

        if (this.position == this.path.length)
        {
            this.position = 0;
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
                return pos.unshift(lvlData.enemies[i].layer);
            });

            this.mobs.push(mob);
        }

        if (this.DEBUG)
        {
	    console.log(lvlData);
            console.log(this.level);
            console.log(this.player);
            console.log(this.goal);
            console.log(this.mobs);
        }

        this.ready = true;
    },

    /*
     * Restart level.
     */
    "restart": function()
    {
        this.player = this.start;

        for (i in this.mobs)
        {
            this.mobs[i].position = 0;
        }
    },

    /*
     * Move player up one layer, regardless of validity.
     */
    "ascend": function()
    {
        this.player = [this.player[0] + 1, this.player[1], this.player[2]];
    },

    /*
     * Move player down one layer, regardless of validity.
     */
    "descend": function()
    {
        this.player = [this.player[0] - 1, this.player[1], this.player[2]];
    },

    /*
     * Move player to the right, regardless of validity.
     */
    "right": function()
    {
        this.player = [this.player[0], this.player[1], this.player[2] + 1];
    },

    /*
     * Move player to the left, regardless of validity.
     */
    "left": function()
    {
        this.player = [this.player[0], this.player[1], this.player[2] - 1];
    },

    /*
     * Move player upwards, regardless of validity.
     */
    "up": function()
    {
        this.player = [this.player[0], this.player[1] + 1, this.player[2]];
    },

    /*
     * Move player downwards, regardless of validity.
     */
    "down": function()
    {
        this.player = [this.player[0], this.player[1] - 1, this.player[2]];
    },

    /*
     * Check if player position is valid.
     */
    "isValidPosition": function()
    {
        // First check within index bounds, then check player standing on tile.
        return this.player[0] >= 0 && this.player[1] >= 0 && this.player[2] >= 0
                && this.player[0] < this.player.length
                && this.player[1] < this.player[0].length
                && this.player[2] < this.player[0][0].length
                && this.level[this.player[0], this.player[1],
                        this.player[2]] != 0;
    },

    /*
     * Check if mob caught player.
     */
    "isCaught": function()
    {
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
	"tiles" : new Array(),

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
	this.curLevel = -1;	
	this.maxLevel = 1;
	this.inMenus = false;
	this.canvas = document.getElementById('game');
	this.ctx = this.canvas.getContext('2d');
}

Engine.prototype = {
	
	"loadLevel": function(lvl) {
		MODEL.ready = false;
		$.getJSON("data/lvl" + lvl + ".json", function(response) {
			MODEL.setLevel(response);
		}).error(function() { alert("Could not load level " + lvl); });

	},

	"showMenu": function() {

	},

	"nextLevel": function() {
		if (this.curLevel < this.maxLevel)
			this.curLevel ++;

		this.loadLevel(this.curLevel);
	},

	"loadImages" : function(imageArray) {
		for (var i=0; i<imageArray.length; i++) {
			$('<img>', {src: imageArray[i]})
				.load(function() {
					var fname = this.src.substring(this.src.lastIndexOf('/')+1);
					if (fname[0] == "c") {
						DATA.tiles[parseInt(fname.replace(/^\D+/g, ''))] = this;
					}
					DATA._parts++;
				}).error(function() { 
					alert("Could not load image " + this.src);
				});

		}
	},

	"drawLoading": function() {
		this.ctx.fillRect(10, 10, 300 * DATA.loading(), 30);
	},

	"drawMenu": function() {

	},

	"drawLevel": function() {
		if (!MODEL.ready)
			return;

		for (var i=0; i<MODEL.level.length; i++) {
			for (var y=0; y<MODEL.level[i].length; y++) {
				for (var x=0; x<MODEL.level[i][y].length; x++) {
					if (MODEL.level[i][y][x] == 1) {
						this.ctx.drawImage(
							DATA.tiles[i], x * 64 + 10,  y * 42 + 10);
					}
				}
			}
		}

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

	"start" : function() {
		this.loadImages(["img/c0.png", "img/c1.png", "img/c2.png"]);
		this.loadLevel(1);
		this.draw();

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
