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

    this.level = undefined;
    this.player = undefined;
    this.goal = undefined;
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
    }
}

var MODEL = new Model();
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

function Engine() {
	this.curLevel = -1;	
	this.maxLevel = 1;
	this.inMenus = false;
	this.canvas = document.getElementById('game');
	this.ctx = this.canvas.getContext('2d');
}

Engine.prototype = {
	
	"loadLevel": function(lvl) {
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
					if (fname.startsWith("c")) {
						DATA.tiles[parseInt(fname.replace(/^\D+/g, ''))] = this;
					}
					DATA._parts++;
				}).error(function() { 
					alert("Could not load image " + this.src);
				});

		}
	},

	"drawLoading": function() {
		ctx.fillRect(10, 10, 300 * DATA.loading, 30);
	},

	"draw" : function() {
		if (DATA.loaded) {


		} else {
			this.drawLoading();
		}
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
e.loadImages(["img/c1.png", "img/c2.png", "img/c3.png"]);
e.loadLevel(1);
