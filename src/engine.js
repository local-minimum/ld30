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

function Engine() {
	
}

Engine.prototype = {
	
	"loadLevel": function(lvl) {
		$.getJSON("data/lvl" + lvl + ".json", function(response) {
			MODEL.setLevel(response);
		}).error(function() { alert("Could not load level " + lvl); });

	},

	"showMenu": function() {

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
e.loadLevel(1);
