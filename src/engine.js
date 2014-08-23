"use strict";

function Model() {
    this.level = undefined;
    this.player = undefined;
    this.goal = undefined;
    this.mobs = [];
}

Model.prototype = {

	"setLevel": function(lvlData) {
            this.level = lvlData.level;
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

var e = new Engine();
e.loadLevel(1);
