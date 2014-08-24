"use strict";

if (!Date.now) {
        Date.now = function() { return new Date().getTime(); };
}

$.ajaxSetup({beforeSend: function(xhr){
  if (xhr.overrideMimeType)
  {
    xhr.overrideMimeType("application/json");
  }
}
});

var DOWN = 40;
var UP = 38;
var LEFT = 37;
var RIGHT = 39;

function Mob()
{
    this.DEBUG = false;

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
    this.DEBUG = false;

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

    /*
     * Callback method after model has been set up
     **/
    this.onLevelCallback = undefined;
    
    /*
     * Allowed layers
     */
    this.allowedLayers = new Array();

    /*
     * Coins
     * */
    this.startCoins = undefined;
    this._coins = undefined;
    this.coins = undefined;

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

        this._setAllowedLayers();
        
        // Create the mobs

        this.mobs = [];

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

        //Generate Coin-Map
        this.startCoins = lvlData.coins;
        this._coins = new Array();
        this.coins = new Array();
        var t = 0;
        for (var y=0; y<this.level[0].length; y++) {
            this._coins.push(new Array());
            this.coins.push(new Array());
            for (var x=0; x<this.level[0][0].length; x++) {
                this._coins[y].push(t);
                this.coins[y].push(0);
            }
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
     * Ask if player gets coin
     */

    "coinAtPlayer": function() {
        return this.coins[this.player[1]][this.player[2]] == 1
    },


    /*
     * Let coins know where player stands
     */

    "setCoinsStatus": function(delta) {
        var t = Date.now();
        this._coins[this.player[1]][this.player[2]] = t;
        this._coins[this.goal[1]][this.goal[2]] = t;
        this.coins[this.player[1]][this.player[2]] = 0;
        for (var y=0;y<this.coins.length;y++) {
            for (var x=0; x<this.coins[0].length;x++) {
                if (this.coins[y][x] < 1) {
                    this.coins[y][x] = (t - this._coins[y][x]) / delta; 
                    if (this.coins[y][x] > 1)
                        this.coins[y][x] = 1;
                }
            }
        }
        return this;
    },

    "_setAllowedLayers" : function() {
        this.allowedLayers = [];

        for (var i=0; i<3; i++) {
            if (this.level[i][this.player[1]][this.player[2]] == 1)
                this.allowedLayers.push(i);

        }
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

        for (var y=0; y<this.level[0].length; y++) {
            for (var x=0; x<this.level[0][0].length; x++) {
                this._coins[y][x] = 0;
                this.coins[y][x] = 1;
            }
        }
        var t = Date.now();
        this._coins[this.player[1]][this.player[2]] = t;
        this._coins[this.goal[1]][this.goal[2]] = t;
        this.coins[this.player[1]][this.player[2]] = 0;

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
        if (!this.isValidPosition()) 
            this.player = [this.player[0], this.player[1], this.player[2] - 1];

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
        if (!this.isValidPosition()) 
            this.player = [this.player[0], this.player[1], this.player[2] + 1];

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
        this.player = [this.player[0], this.player[1] - 1, this.player[2]];
        if (!this.isValidPosition()) 
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
        this.player = [this.player[0], this.player[1] + 1, this.player[2]];
        if (!this.isValidPosition()) 
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
        if (!(this.player[0] >= 0 && this.player[1] >= 0 && this.player[2] >= 0
                && this.player[0] < this.level.length
                && this.player[1] < this.level[0].length
                && this.player[2] < this.level[0][0].length)) {

            return false;
        }

        var val = this.level[this.player[0]][this.player[1]][this.player[2]] != 0;

        if (!val) {
            for (var i=0; i<this.allowedLayers.length;i++) {
                if (this.level[this.allowedLayers[i]][this.player[1]][this.player[2]] != 0) {
                    val = true;
                    this.player[0] = this.allowedLayers[i];
                    break;
                }
            }
        }

        if (val)
            this._setAllowedLayers();

        return val;
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
            if (//this.allowedLayers.indexOf(this.mobs[i].getPos()[0]) >= 0 &&
                    this.player[1] == this.mobs[i].getPos()[1]
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
        return this.player[0] == this.goal[0] && this.player[1] == this.goal[1] &&
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
    "snds" : new Array()

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
    this.MOVABLES = 4;
    this.COINS = 3;
    this.UI = undefined;

    this.curLevel = 0;    
    this.maxLevel = 10;
    this.inMenus = false;
    this.knownActiveLayers = undefined;
    this.offsetX;
    this.offsetY;
    this.player = undefined;
    this.mobs = undefined;
    this.coins = undefined;
    this.drawLayers = new Array();
    this.stage = undefined;
    this.ticker = 0;
    this.requestMove = undefined;
    this.requestColor = undefined;
    this.levelStartTime = undefined;
    this.coinDelta = 4500;
    this.curCoins = 50;
    this.coinsText = undefined;
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

            if (imageArray[i].length == 2) {
                DATA.imgs[imageArray[i][0]] = new Kinetic.Image( {
                    x: 0,
                    y: 0,
                    image: imageObj,
                    draggable: false});
            } else {
                var struct = {
                    x: 0,
                    y: 0,
                    frameIndex: 0,
                    frameRate: 7,
                    image: imageObj,
                    animation: 'default'
                }
                for (var key in imageArray[i][2])
                    struct[key] = imageArray[i][2][key];

                DATA.imgs[imageArray[i][0]] = new Kinetic.Sprite(struct);
            }
            imageObj.src = imageArray[i][1]
            //DATA.imgs[imageArray[i][0]].cache();
        }
    },

    "loadSounds" : function(sndsArray) {
        var suffix = ".ogg";
        if ((new Audio()).canPlayType("audio/ogg") == "") {
            if ((new Audio()).canPlayType("audio/mp3") != "")
                suffix = ".mp3";
            else if ((new Audio()).canPlayType("audio/wav") != "")
                suffix = ".wav";

        }
        for (var i=0; i<sndsArray.length; i++) {
            DATA.snds[sndsArray[i][0]] = new Audio(sndsArray[i][1] + suffix);
            DATA.snds[sndsArray[i][0]].addEventListener(
                    'canplaythrough', function() {DATA._parts++;}, false);
        }
    },

    "reset": function() {
        this.curCoins = MODEL.startCoins;
    },

    "initLevel" : function() {

        if (!DATA.loaded) {
            return;
        }

        this.reset();
        for (var i=0; i<MODEL.level.length; i++) {
            var addLayer = false;
            if (this.drawLayers.length <= i) {
                this.drawLayers[i] = new Kinetic.Layer();
                this.drawLayers[i].clearBeforeDraw = false;
                this.drawLayers[i].height = MODEL.level[i].length * 42;
                this.drawLayers[i].width = MODEL.level[i][0].length * 64;
                addLayer = true;
            } else {
                this.drawLayers[i].destroyChildren();
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

        //HANDLE COINS
        if (this.drawLayers.length < this.COINS + 1) {
            this.drawLayers[this.COINS] = new Kinetic.Layer();
            this.stage.add(this.drawLayers[this.COINS]);
        } else {
            this.drawLayers[this.COINS].destroyChildren();
        }
        this.coins = [];
        for (var y=0; y<MODEL.coins.length; y++) {
            this.coins.push([]);
            for (var x=0; x<MODEL.coins[0].length; x++) {
                this.coins[y].push(DATA.imgs["coin"].clone({
                    x: x * 64 + 26, y: y * 42 + 8}));
                this.drawLayers[this.COINS].add(this.coins[y][x]);
                this.coins[y][x].visible(MODEL.coins[y][x] == 1);
            }
        }

        //HANDLE MOVABLES
        if (this.drawLayers.length < this.MOVABLES + 1) {
            this.drawLayers[this.MOVABLES] = new Kinetic.Layer();
            this.stage.add(this.drawLayers[this.MOVABLES]);
        } else {
            this.drawLayers[this.MOVABLES].destroyChildren();
        }
        this.player = DATA.imgs["player"].clone({
            x: MODEL.player[2] * 64, y: MODEL.player[1] * 42});
        this.drawLayers[this.MOVABLES].add(this.player);

        this.mobs = new Array();
        for (var i=0; i < MODEL.mobs.length; i++) {
            var mPos = MODEL.mobs[i].getPos();
            this.mobs[i] = DATA.imgs["mob"].clone({
                x: mPos[2]*64, y: mPos[1] * 42});
            this.mobs[i].start();
            this.drawLayers[this.MOVABLES].add(this.mobs[i]);
            };
        
        //HANDLE UI
        /*
        if (this.UI) {
            this.UI.destroyChildren();
        } else {
            this.UI = new Kinetic.Layer();
            this.stage.add(this.UI);
        }
        this.coinsText = new Kinetic.Text({
            x: 10,
            y: 10,
            text: "Shards: " + this.curCoins,
            fontSize: 30,
            color: "black",
            fontFamily: "serif"});
        this.UI.add(this.coinsText);
        */

        DATA.snds['level'].addEventListener("ended", function() {
                this.currentTime = 0;
                this.play();
                }, false);

        DATA.snds['level'].play();

        this.levelStartTime = Date.now();
    },

    "drawLoading": function() {
        //this.ctx.fillRect(10, 10, 300 * DATA.loading(), 30);
    },

    "drawMenu": function() {

    },

    "drawLevel": function() {
        if (!MODEL.ready)
            return;

        this.player.x(MODEL.player[2] * 64 + 2);
        this.player.y(MODEL.player[1] * 42 - 10);

        for (var i=0; i<MODEL.mobs.length; i++) {
            var mobP = MODEL.mobs[i].getPos();
            this.mobs[i].x(mobP[2] * 64 + 5);
            this.mobs[i].y(mobP[1] * 42 - 10);
        }

        this.offsetY = (MODEL.height - MODEL.player[1]) * 42 - 200;
        this.offsetX = (MODEL.width - MODEL.player[0]) * 64 - 200;
        var aL = MODEL.activeLayers();
        
        for (var y=0; y<MODEL.coins.length; y++) {
            for (var x=0; x<MODEL.coins[0].length; x++) {
                this.coins[y][x].visible(MODEL.coins[y][x] == 1);
            }
        }

        for (var i=0; i<this.drawLayers.length; i++) {
            this.drawLayers[i].offsetX(this.player.x() - 200);
            this.drawLayers[i].offsetY(this.player.y() - 200);
            this.drawLayers[i].opacity(aL[i] * 0.7 + 0.05);
        }

        //this.coinsText.text("Shards: " + this.curCoins);
        this.coinsText.html("Shards: " + this.curCoins);

        for (var i=0; i<this.drawLayers.length; i++)
            this.drawLayers[i].draw()

        //this.UI.draw();
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

            } else if (MODEL.ready) {

                if (MODEL.isWinning()) {
                    console.log("Won");
                    DATA.snds["completed"].play();
                    this.reset();
                    this.nextLevel();
                }

                if (!MODEL.isValidPosition()) {
                    console.log("Fell off");
                    this.reset();
                    MODEL.restart();
                    return;
                }

                if (MODEL.isCaught()) {
                    console.log("Caught");
                    DATA.snds["caught"].play();
                    this.reset();
                    MODEL.restart();
                    return;
                }

                if (this.curCoins <= 0) {
                    console.log("Starved");
                    DATA.snds["starved"].play();
                    this.reset();
                    MODEL.restart();
                }

                if (MODEL.ready) {
                    if (this.ticker % 11 == 0)
                        this.curCoins --;

                    if (this.ticker % 17 == 0)
                        MODEL.moveMobs();

                    if (this.ticker % 7 == 0) {

                        if (this.requestMove == UP)
                            MODEL.up();
                        else if (this.requestMove == DOWN)
                            MODEL.down();
                        else if (this.requestMove == LEFT)
                            MODEL.left();
                        else if (this.requestMove == RIGHT)
                            MODEL.right();
                        
                        if (MODEL.coinAtPlayer()) {
                            DATA.snds["coin"].play();
                            this.curCoins ++;
                        }

                        MODEL.setCoinsStatus(this.coinDelta);
                        this.requestMove = undefined;
                    }
                    
                }
            }
        } else {
            
        }

        this.ticker++;
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
                ["mob", "img/mob.png", {animations: {
                    standing: [
                        0, 0, 27, 31,
                        27, 0, 32, 31,
                        60, 0, 26, 31
                    ]},
                    frameRate: 7,
                    animation: 'standing'
                    }],
                ["coin", "img/coin.png"]]);

        this.loadSounds([
                ["coin", "sound/coin"],
                ["caught", "sound/caught"],
                ["starved", "sound/starved"],
                ["completed", "sound/lvlCompleted"],
                ["level", "sound/aRunningPuppy"]]);
        
        //TODO: A hack to load first level
        var f1 = $.proxy(this, "nextLevel");
        setTimeout(f1, 200)

        this.coinsText = $("#shards");

        //Setting up callbacks
        var f = $.proxy(this, "draw");
        window.setInterval(f, 31);
        var f2 = $.proxy(this, "update");
        window.setInterval(f2, 31);

    }
}

var e = new Engine();
e.start();
function checkKey(ev) {    
    var code = ev.keyCode || ev.witch;
    if (code == UP)
        e.requestMove = UP;
    else if (code == RIGHT)
        e.requestMove = RIGHT;
    else if (code == DOWN)
        e.requestMove = DOWN;
    else if (code == LEFT)
        e.requestMove = LEFT;
    else if (code == 82)
        MODEL.restart();
    else if (code == 77)
        DATA.snds["level"].muted = !DATA.snds["level"].muted;
    else 
        console.log(code);
}

$(document).keydown (checkKey);
