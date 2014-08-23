"use strict";

function Model() {

}

Model.prototype = {

	"setLevel": function(lvlData) {
		console.log(lvlData);
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
