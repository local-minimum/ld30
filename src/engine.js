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
    this.DEBUG = false;

	this.ready = false;
    this.level = undefined;
    this.player = undefined;
    this.goal = undefined;
    this.onLevelCallback = undefined;
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

		if (this.onLevelCallback)
			this.onLevelCallback();

        this.ready = true;
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
					this.offsetY = (MODEL.height - MODEL.player[1]) * 42 - 200;
					this.offsetX = (MODEL.width - MODEL.player[0]) * 64 - 200;
					
					if (this.knownLayers != MODEL.activeLayers) {

					}
					for (int i=0; i<this.drawLayers.length, i++) {
						this.drawLayers[i].offsetX(this.offsetX);
						this.drawLayers[i].offsetY(this.offsetY);
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
				[0, "img/c0.png", 64, 42],
				[1, "img/c1.png", 64, 42],
				[2, "img/c2.png", 64, 42]]);
		
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
