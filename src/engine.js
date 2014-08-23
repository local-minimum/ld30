"use strict";

function Model() {

}

Model.prototype = {

	"setLevel": function(lvlData) {

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
