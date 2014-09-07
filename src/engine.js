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

var gW = $("#game");
var SHAPE_X = gW.width();
var SHAPE_Y = gW.height();
var IN_GAME_SCALE = 1.5;
var DOWN = 40;
var UP = 38;
var LEFT = 37;
var RIGHT = 39;
var ENTER = 13;
var BASE_OPACITY = 0.45;
var ACTIVE_OPACITY = 0.25;
var STAGE_OPACITY = 1;
var JUMP_TO_FUNC = undefined;
var CHEAT_FUNC = undefined;
var REGRET_CHEAT_FUNC = undefined;
var JUMP_TO_ELEM = $("#jumpCode");

//$("#lvl").html("Touch " + $.mobile.support.touch);

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

    /*
     * Player start rotation
     * */

    this.startRotation = undefined;

    /*
     * Level name
     * */

    this.name;

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
        this.startRotation = lvlData.startRotation;
        this.name = lvlData.name;
        if (!this.name)
            this.name = "";

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
        this.coins[this.goal[1]][this.goal[2]] = 0;
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
        this.coins[this.goal[1]][this.goal[2]] = 0;

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
    "imageParts" : 0,
    "musicParts" : 0,
    "loadStarted": undefined,
    "imageTotal": 0,
    "musicTotal": 0,
    "imgs" : new Array(),
    "snds" : new Array()

};

DATA.loaded = function(part) {
    if (!DATA._loaded) {
        DATA._loaded = DATA.loading(part) >= 1;
    }
    return DATA._loaded;
}

DATA.loading = function(part) {
    if (part == undefined)
        return (DATA.imageParts + DATA.musicParts) / (DATA.imageTotal + DATA.musicTotal);
    else if (part == "images")
        return DATA.imageParts / DATA.imageTotal;
    else if (part == "music")
        return DATA.musicParts / DATA.musicTotal;
}

/*
 * ENGINE
 */

function Engine() {
    this.MOVABLES = 4;
    this.COINS = 3;
    this.UI = new Kinetic.Layer();
    this.playerRotations = {
        UP: {
            rotation: 0,
            x: 20,
            y: 0},
        RIGHT: {
            rotation: 70,
            x: 40,
            y: -0},
        DOWN: {
            rotation: 180,
            x: 44,
            y: -30},
        LEFT: {
            rotation: 250,
            x: 15,
            y: -34}
    };
    this.playerOff = this.playerRotations.UP;
    this.curLevel = 0;    
    this.retries = 0;
    this.skippedLevels = new Array();
    this.cheaters = new Array();
    this.maxLevel = 20;
    this.inMenus = true;
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
    this.playing = false;
    this.curCoins = 50;
    this.coinsText = undefined;
    this.lvlGoal = undefined;
    this.moved = false;
    this.movedMob = false;
    this.menuLayer = undefined;
    this.loadingWedge = new Kinetic.Wedge({
        x: SHAPE_X / 2,
        y: SHAPE_Y / 2,
        radius: (SHAPE_Y + SHAPE_X) / 6,
        angle: 0,
        fill: '#530000',
        stroke: '#f24f00',
        strokeWidth: 4,
        rotation: -120});
    this.loadingLayer = new Kinetic.Layer();
    this.waitForSoundTime = 2;
    this.menuBeetle = undefined;
    this.menuStart = true;
    this.allowInput = true;
}

Engine.prototype = {
    
    "loadLevel": function(lvl) {
        this.curLevel = lvl;
        this.retries = 0;
        $("#tf").attr('src', 'index2.html?lvl='+lvl);
        MODEL.ready = false;
        MODEL.onLevelCallback = $.proxy(this, "initLevel");
        $.getJSON("data/lvl" + lvl + ".json", function(response) {
            MODEL.setLevel(response);
        }).error(function() { alert("Could not load level " + lvl); });

    },

    "showMenu": function() {

        for (var i=0; i<this.menuLayer.length; i++)
            this.menuLayer[i].visible(true);

        for (var i=0; i<this.drawLayers.length; i++)
            this.drawLayers[i].visible(false);
        this.inMenus = true;
        this.menuStart = this.curLevel == 0;
        this.stage.offsetX(0);
        this.stage.offsetY(0);
        this.stage.scale({x:1, y:1});
    },

    "hideMenu": function() {

        for (var i=0; i<this.menuLayer.length; i++)
            this.menuLayer[i].visible(false);

        for (var i=0; i<this.drawLayers.length; i++)
            this.drawLayers[i].visible(true);

        this.inMenus = false;
        this.moved = true;
        this.stage.scale({x:IN_GAME_SCALE, y:IN_GAME_SCALE});

    },

    "nextLevel": function() {
        if (this.curLevel < this.maxLevel) {
            this.loadLevel(this.curLevel + 1);
        } else {
            this.curLevel = 0;
            for (var i=0; i<this.drawLayers.length; i++)
                this.drawLayers[i].destroyChildren();
            this.stage.scale({x:1, y:1});
            this.stage.opacity(1);
            this.stage.offsetX(0);
            this.stage.offsetY(0);
            this.drawLayers[0].opacity(ACTIVE_OPACITY + BASE_OPACITY);

            this.drawLayers[0].add(DATA.imgs["theEnd"].clone(
                {x:SHAPE_X / 2 - 200, y: SHAPE_Y / 2 - 200}));
            var f = $.proxy(this, "winFinal");
            setTimeout(f, 10000);
        }
    },

    "cheatTweening" : function(e) {
        var inCheaters = false;
        for (var i=0; i<this.cheaters.length; i++) {
            if (this.cheaters[i] = e) {
                inCheaters = true;
                break;
            }
        }

        if (!inCheaters)
            return;

        var f = $.proxy(this, "cheatTweening");

        var tween = new Kinetic.Tween(
            {node: e,
             x: SHAPE_X * Math.random() - 150,
             y: SHAPE_Y * Math.random() - 40,
             duration: 2,
             onFinish: function() {
                 f(e);
             }
            });

        tween.play();
    },

    "addCheater": function() {
        var e = DATA.imgs["cheat"].clone(
            {x: SHAPE_X * Math.random() - 150,
             y: SHAPE_Y * Math.random() - 40});
        e.clickCB = DATA.imgs["cheat"].clickCB;
        this.cheaters.push(e);
        this.UI.add(e);
        this.cheatTweening(e);
    },

    "skipLevel": function() {
        if (this.curLevel <= 0)
            return;
        this.skippedLevels.push(this.curLevel);
        this.addCheater();
        this.nextLevel();
    },

    "regretLastSkip": function() {
        if (this.skippedLevels.length == 0)
            return;

        this.cheaters.pop().destroy();
        this.loadLevel(this.skippedLevels.pop());

        if (this.skippedLevels.length == 0)
            $("#regretCheat").attr("class", "hiddenElem");
    },

    "generateCode": function() {
        var lB = 65;
        var chrs = 23;
        var A = new Array();
        var s = this.skippedLevels.length + 1;

        for (var i=0; i<2; i++) {
            A.push(String.fromCharCode(
                (this.curLevel * lB) * (s + i) % chrs + lB));
        }
        for (var j=0; j<2; j++) {
            var v = 0;
            for (var i=j; i< s - 1; i+=2) {
                v += Math.pow(2, this.skippedLevels[i]);
            }
            A.push(String.fromCharCode((v + j + 1) * A[j].charCodeAt(0) % chrs + lB));
        }
        //console.log(A.join(""), this.curLevel, this.skippedLevels);
        $("#jumpCode").val(A.join(""));
    },

    "setStateFromCode": function() {
        var code = $("#jumpCode").val();
        if (code.length != 4)
            return;

        var lB = 65;
        var chrs = 23;

        var A = code.toUpperCase().charCodeAt(0) - lB;
        var B = code.toUpperCase().charCodeAt(1) - lB;
        var C = code.toUpperCase().charCodeAt(2) - lB;
        var D = code.toUpperCase().charCodeAt(3) - lB;

        //console.log(A, B, C, D);

        var BA = B - A;
        while ((BA < lB || BA % lB != 0) && BA < lB * 20)
            BA += chrs;

        if (BA % lB != 0) {
            console.log("Try cheating", "Level not exist");
            return;
        }

        var cL = BA / lB

        while ((A < lB * cL || A % (lB * cL) != 0) && A < lB * cL * (cL + 1))
            A += chrs;

        if (A % (lB * cL) != 0) {
            console.log("Try cheating", "Impossible number of skips");
            return;
        }

        var s = A / (lB * cL) - 1;

        var A = code.toUpperCase().charCodeAt(0);
        var B = code.toUpperCase().charCodeAt(1);

        while ((C < 1 * A || C % A != 0) && C < Math.pow(2, 21))
            C += chrs;

        if (C % A != 0) {
            console.log("Try cheating", "Second Last character");
            return;
        }

        var v = C/A - 1;

        while ((D < 2 * B || D % B != 0) && C < Math.pow(2, 21))
            D += chrs;

        if (D % B != 0) {
            console.log("Try cheating", "Last character");
            return;
        }

        v += D/B - 2;

        v = v.toString(2);


        var A = new Array();
        for (var i=v.length-1;i>=0;i--) {
            if (v[i] == '1')
                A.push(v.length - i);
        }

        //console.log(cL, s, A);

        if (A.length != s) {
            console.log("Try cheating", "wrong number of skips");
            return;
        }

        for (var i=0;i<A.length;i++) {
            if (A[i] >= cL) {
                console.log("Try cheating", "impossible skip");
                return;
            }

        }
        this.skippedLevels = A;
        for (var i=0;i<A.length;i++)
            this.addCheater();

        this.loadLevel(cL);

    },

    "rescale": function(s) {

        if (s == 1)
            IN_GAME_SCALE = 1;
        else if (s == 2)
            IN_GAME_SCALE = 1.25;
        else if (s == 3)
            IN_GAME_SCALE = 1.5;
        else if (s == 4)
            IN_GAME_SCALE = 2;

        this.offsetX = MODEL.player[2] * 64 + 32 - SHAPE_X / (2 * IN_GAME_SCALE);
        this.offsetY = MODEL.player[1] * 42 + 21 - SHAPE_Y / (2 * IN_GAME_SCALE);

        if (!this.inMenus) {
            this.stage.scale({x:IN_GAME_SCALE, y:IN_GAME_SCALE});
            this.moved = true;
        }
    },

    "loadImages" : function(imageArray) {
        for (var i=0; i<imageArray.length; i++) {
            var imageObj = new Image();
            imageObj.onload = function() {
                DATA.imageParts++;
            }

            if (imageArray[i].anim == undefined) {
                DATA.imgs[imageArray[i].name] = new Kinetic.Image( {
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
                };
                for (var key in imageArray[i].anim)
                    struct[key] = imageArray[i].anim[key];

                DATA.imgs[imageArray[i].name] = new Kinetic.Sprite(struct);
            }
            if (imageArray[i].callback) {
                DATA.imgs[imageArray[i].name].clickCB = $.proxy(this,
                                 imageArray[i].callback.method, 
                                 imageArray[i].callback.args);

                DATA.imgs[imageArray[i].name].on($.mobile.support.touch ? "tap" : "click", function(evt) {
                    evt.target.clickCB(evt.target);
                }).on( "mouseover", function(evt) {
                    document.body.style.cursor = 'pointer';
                }).on( "mouseout", function(evt) {
                    document.body.style.cursor = 'default';
                });
            }

            imageObj.src = imageArray[i].file;
        }
    },

    "loadSounds" : function(sndsArray) {
        var suffix = ".ogg";
        if ((new Audio()).canPlayType("audio/ogg") == "") {
            if ((new Audio()).canPlayType("audio/mp3") != "")
                suffix = ".mp3";
            else if ((new Audio()).canPlayType("audio/wav") != "")
                suffix = ".wav";
            else
                DATA.total --;

        }
        for (var i=0; i<sndsArray.length; i++) {
            DATA.snds[sndsArray[i][0]] = new Audio(sndsArray[i][1] + suffix);
            DATA.snds[sndsArray[i][0]].addEventListener(
                    'canplaythrough', function() {DATA.musicParts++;}, false);
        }
    },

    "reset": function() {
        this.curCoins = MODEL.startCoins;
        this.playing = false;
        if (MODEL.startRotation == "UP")
            this.playerOff = this.playerRotations.UP;
        else if (MODEL.startRotation == "RIGHT")
            this.playerOff = this.playerRotations.RIGHT;
        else if (MODEL.startRotation == "DOWN")
            this.playerOff = this.playerRotations.DOWN;
        else if (MODEL.startRotation == "LEFT")
            this.playerOff = this.playerRotations.LEFT;
        this.player.rotation(this.playerOff.rotation);
        this.player.x(MODEL.player[2] * 64 + this.playerOff.x);
        this.player.y(MODEL.player[1] * 42 - this.playerOff.y);
        this.offsetX = MODEL.player[2] * 64 + 32 - SHAPE_X / (2 * IN_GAME_SCALE);
        this.offsetY = MODEL.player[1] * 42 + 21 - SHAPE_Y / (2 * IN_GAME_SCALE);
        this.mobMoved = true;
        this.moved = true;
        this.requestMove = undefined;
        this.allowInput = true;

        if (this.retries > 3)
            $("#cheat").attr("class", "");
        else
            $("#cheat").attr("class", "hiddenElem");

        if (this.skippedLevels.length > 0)
            $("#regretCheat").attr("class", "");

        this.hideMenu();
        this.drawLayers[this.COINS].visible(true);
        this.stage.opacity(STAGE_OPACITY);
    },

    "initMenu":function() {

        this.loadingLayer.visible(false);
        this.menuLayer = [];
        this.menuLayer[0] = new Kinetic.Layer();
        this.menuLayer[0].add(DATA.imgs['title']);
        DATA.imgs['title'].x((SHAPE_X - DATA.imgs['title'].width()) / 2);
        DATA.imgs['title'].y(SHAPE_Y * 0.1);
        this.menuLayer[0].add(DATA.imgs['startA']);
        this.menuLayer[0].add(DATA.imgs['startI']);
        DATA.imgs['startA'].x(SHAPE_X/ 2 - 100);
        DATA.imgs['startA'].y(SHAPE_Y * 3 / 4);
        DATA.imgs['startI'].x(SHAPE_X / 2 - 100);
        DATA.imgs['startI'].y(SHAPE_Y * 3 / 4);
        this.menuLayer[0].add(DATA.imgs['resumeA']);
        this.menuLayer[0].add(DATA.imgs['resumeI']);
        DATA.imgs['resumeA'].x(SHAPE_X/ 2 - 100);
        DATA.imgs['resumeA'].y(SHAPE_Y * 0.625);
        DATA.imgs['resumeI'].x(SHAPE_X / 2 - 100);
        DATA.imgs['resumeI'].y(SHAPE_Y * 0.625);
        this.menuBeetle = DATA.imgs['player'].clone(
                {x: SHAPE_X / 2 - 140, y: 260});
        this.menuBeetle.start();
        this.menuLayer[0].add(this.menuBeetle);

        this.menuLayer[1] = new Kinetic.Layer();
        this.menuLayer[1].add(DATA.imgs['menuCandy1']);
        this.menuLayer[2] = new Kinetic.Layer();
        this.menuLayer[2].add(DATA.imgs['menuCandy2']);
        this.menuLayer[3] = new Kinetic.Layer();
        this.menuLayer[3].add(DATA.imgs['menuCandy3']);
        DATA.imgs['menuCandy1'].x((SHAPE_X - DATA.imgs['menuCandy1'].width()) / 2);
        DATA.imgs['menuCandy2'].x((SHAPE_X - DATA.imgs['menuCandy1'].width()) / 2);
        DATA.imgs['menuCandy3'].x((SHAPE_X - DATA.imgs['menuCandy1'].width()) / 2);
        DATA.imgs['menuCandy1'].y(SHAPE_Y / 2 - 130);
        DATA.imgs['menuCandy2'].y(SHAPE_Y / 2 - 130);
        DATA.imgs['menuCandy3'].y(SHAPE_Y / 2 - 130);

        for (var i=0; i<this.menuLayer.length; i++)
            this.stage.add(this.menuLayer[i]);

        DATA.snds['level'].addEventListener("ended", function() {
                this.currentTime = 0;
                this.play();
                }, false);

        DATA.snds['level'].play();

        //console.log("Menu ready");

    },

    "initLevel" : function() {

        if (!DATA.loaded()) {
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
                this.drawLayers[i].destroyChildren();
            }
                
            for (var y=0; y<MODEL.level[i].length; y++) {
                for (var x=0; x<MODEL.level[i][y].length; x++) {
                    if (MODEL.level[i][y][x] == 1) {
                        var e = DATA.imgs[i].clone({
                            x: x*64, y:y*42});
                        e.clickCB = DATA.imgs[i].clickCB;
                        this.drawLayers[i].add(e);
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
                    x: x * 64 + 26, y: y * 42 + 10}));
                this.drawLayers[this.COINS].add(this.coins[y][x]);
                this.coins[y][x].visible(MODEL.coins[y][x] == 1);
            }
        }

        if (!this.lvlGoal)
            this.lvlGoal = DATA.imgs['goal'].clone({
                x: MODEL.goal[2]*64 + 20, y: MODEL.goal[1]*42 - 10});
        else {
            this.lvlGoal.x(MODEL.goal[2]*64 + 20);
            this.lvlGoal.y(MODEL.goal[1]*42 - 10);
        }
        this.drawLayers[this.COINS].add(this.lvlGoal);

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
        this.player.start();
        this.mobs = new Array();
        for (var i=0; i < MODEL.mobs.length; i++) {
            var mPos = MODEL.mobs[i].getPos();
            this.mobs[i] = DATA.imgs["mob"].clone({
                x: mPos[2]*64, y: mPos[1] * 42});
            this.mobs[i].start();
            this.drawLayers[this.MOVABLES].add(this.mobs[i]);
            };
        

        this.stage.add(this.UI);
        $("#lvl").html("Level " + this.curLevel + ": " + MODEL.name);
        this.generateCode();
        this.reset();
        this.levelStartTime = Date.now();

    },

    "drawLoading": function() {
        this.loadingWedge.angle(360 * DATA.loading());
        this.loadingLayer.draw();
    },

    "drawMenu": function() {
        if (this.menuLayer) {
            DATA.imgs["resumeI"].visible(this.curLevel > 0 && this.menuStart);
            DATA.imgs["resumeA"].visible(this.curLevel > 0);
            DATA.imgs["startI"].visible(!this.menuStart)
            if (this.menuStart) {
                this.menuBeetle.y(SHAPE_Y * 3 / 4 + 10);
            } else {
                this.menuBeetle.y(SHAPE_Y * 0.625 + 10);
            }

            var t = Date.now();

            if (t % 3000 < 1100) 
                this.menuLayer[1].opacity(ACTIVE_OPACITY + BASE_OPACITY);
            else
                this.menuLayer[1].opacity(BASE_OPACITY);
            if (t % 3000 > 1000 && t % 3000 < 2100)
                this.menuLayer[2].opacity(ACTIVE_OPACITY + BASE_OPACITY);
            else
                this.menuLayer[2].opacity(BASE_OPACITY);
            if (t % 3000 > 2000 || t % 3000 < 100)
                this.menuLayer[3].opacity(ACTIVE_OPACITY + BASE_OPACITY);
            else
                this.menuLayer[3].opacity(BASE_OPACITY);

            for (var i=0;i<this.menuLayer.length;i++)
                this.menuLayer[i].draw();
        } else {
            this.initMenu();
        }
    },

    "drawLevel": function() {
        if (!MODEL.ready)
            return;

        if (!this.allowInput)
            this.drawLayers[this.COINS].visible(false);

		if (this.ticker % 2) {
			if (this.ticker % 20 > 9)
				this.lvlGoal.y(MODEL.goal[1] * 42 - 19 + this.ticker % 10);
			else
				this.lvlGoal.y(MODEL.goal[1] * 42 - 10 - this.ticker % 10);

			for (var y=0; y<MODEL.coins.length; y++) {
				for (var x=0; x<MODEL.coins[0].length; x++) {
					this.coins[y][x].visible(MODEL.coins[y][x] == 1);
				}
			}
		}

        //this.coinsText.text("Shards: " + this.curCoins);

        if (this.movedMob) {
            for (var i=0; i<MODEL.mobs.length; i++) {
                var mobP = MODEL.mobs[i].getPos();
                this.mobs[i].x(mobP[2] * 64 + 15);
                this.mobs[i].y(mobP[1] * 42 - 4);
            }

            this.movedMob = false;
        }

        if (this.ticker % 11 == 0) {
            this.coinsText.html("Shards: " + this.curCoins);
            if (this.curCoins < 10 && this.ticker % 22 == 0) {
                this.coinsText.attr("class", "urgentShard");
            } else {
                this.coinsText.attr("class", "");
            }
        }

        if (this.moved) {
            this.player.x(MODEL.player[2] * 64 + this.playerOff.x);
            this.player.y(MODEL.player[1] * 42 - this.playerOff.y);

            var aL = MODEL.activeLayers();
            
            for (var i=0; i<this.drawLayers.length; i++) {
                this.drawLayers[i].opacity(aL[i] * ACTIVE_OPACITY + BASE_OPACITY);
            }
            var tween = new Kinetic.Tween({
                node: this.stage,
                offsetX: this.offsetX,
                offsetY: this.offsetY,
                duration: 0.03*3,
                easing: Kinetic.Easings.EaseInOut
            });
            if (this.cheaters.length > 0) {
				var tween2 = new Kinetic.Tween({
					node: this.UI,
					offsetY: -this.offsetY,
					offsetX: -this.offsetX,
					duration: 0.03*3,
					easing: Kinetic.Easings.EaseInOut

				});
				tween2.play();
			}
            tween.play();

	        this.drawLayers[MODEL.player[0]].moveToBottom();

            this.moved = false;
        }

        for (var i=0; i<this.drawLayers.length; i++) {
            this.drawLayers[i].draw();
		}

        if (this.cheaters.length > 0)
        	this.UI.draw();
    },

    "draw" : function() {
        if (DATA.loaded()) {
            if (this.inMenus)
                this.drawMenu();
            else
                this.drawLevel();

        } else {
            this.drawLoading();
        }
    },

    "win": function() {
        this.allowInput = false;
        for (var i=0; i<this.mobs.length; i++)
            this.mobs[i].visible(false);
        var d2 = $.proxy(this, "nextLevel");
        var tween = new Kinetic.Tween({
            node: this.stage,
            duration: 1.55,
            opacity: 0,
            easing: Kinetic.Easings.EaseIn
        });
        tween.play();
        setTimeout(d2, 2000);
    },

    "winFinal": function() {
        this.reset();
        this.skippedLevels = [];
        while (this.cheaters.length > 0)
            this.cheaters.pop().destroy();

        $("#regretCheat").attr("class", "hiddenElem");
        this.showMenu();
    },

    "death": function() {
        this.allowInput = false;
        this.retries += 1;
        var d2 = $.proxy(this, "death2");
        var tween = new Kinetic.Tween({
            node: this.stage,
            duration: 0.95,
            opacity: 0,
            easing: Kinetic.Easings.EaseIn
        });
        tween.play();
        setTimeout(d2, 1300);

    },

    "death2": function() {

        MODEL.restart();
        this.reset();
    },

    "startNewGame": function(data, node) {
        this.curLevel = 0;
        this.skippedLevels = [];
        while (this.cheaters.length > 0)
            this.cheaters.pop().destroy();
        $("#regretCheat").attr("class", "hiddenElem");
        this.nextLevel();
        this.hideMenu();
    },

    "clickNavigate": function(data, node) {
        var relX = (node.x() - MODEL.player[2] * 64) / SHAPE_X;
        var relY = (node.y() - MODEL.player[1] * 42) / SHAPE_Y;
        if (relX > 0 && (relY >= 0 && relX > relY || relY < 0 && relX > -relY))
            this.requestMove = RIGHT;
        else if (relX < 0 && (relY >= 0 && -relX > relY || relY < 0 && -relX > -relY))
            this.requestMove = LEFT;
        else if (relY < 0)
            this.requestMove = UP;
        else 
            this.requestMove = DOWN;
    },

    "update": function() {
        if (DATA.loaded()) {
            if (this.inMenus) {

                if (this.requestMove == ENTER) {
                    if (this.menuStart) {
                        this.startNewGame();
                    } else
                        this.hideMenu();
                } else if (this.requestMove == UP || this.requestMove == DOWN) {
                    if (this.curLevel > 0)
                        this.menuStart = !this.menuStart;
                }

                this.requestMove = undefined;

            } else if (MODEL.ready && this.allowInput) {

                if (MODEL.ready) {
                    if (this.playing && this.ticker % 11 == 0)
                        this.curCoins --;

                    if (this.ticker % 17 == 0) {
                        MODEL.moveMobs();
                        this.movedMob = true;
                    }

                    if (this.ticker % 3 == 0) {

                        if (this.requestMove == UP) {
                            this.playerOff = this.playerRotations.UP;
                            this.playing = true;
                            this.moved = true;
                            MODEL.up();
                        } else if (this.requestMove == DOWN) {
                            this.playerOff = this.playerRotations.DOWN;
                            this.playing = true;
                            this.moved = true;
                            MODEL.down();
                        } else if (this.requestMove == LEFT) {
                            this.playerOff = this.playerRotations.LEFT;
                            this.playing = true;
                            this.moved = true;
                            MODEL.left();
                        } else if (this.requestMove == RIGHT) {
                            this.playerOff = this.playerRotations.RIGHT;
                            this.playing = true;
                            this.moved = true;
                            MODEL.right();
                        }

                        if (this.moved) {

                            this.offsetX = MODEL.player[2] * 64 + 32 - SHAPE_X / (2 * IN_GAME_SCALE);
                            this.offsetY = MODEL.player[1] * 42 + 21 - SHAPE_Y / (2 * IN_GAME_SCALE);
                            this.player.rotation(this.playerOff.rotation);

                            if (MODEL.coinAtPlayer()) {
                                DATA.snds["coin"].play();
                                this.curCoins ++;
                            }
                        }

                        MODEL.setCoinsStatus(this.coinDelta);
                        this.requestMove = undefined;
                    }
                    
                }

                if (MODEL.isWinning()) {
                    console.log("Won");
                    DATA.snds["completed"].play();
                    this.win();
                    return;
                }

                /* This death no longer possible
                if (!MODEL.isValidPosition()) {
                    console.log("Fell off");
                    this.death();
                    return;
                }
                */

                if (MODEL.isCaught()) {
                    console.log("Caught");
                    DATA.snds["caught"].play();
                    this.death();
                    return;
                }

                if (this.curCoins <= 0) {
                    console.log("Starved");
                    DATA.snds["starved"].play();
                    this.death();
                    return;
                }

            }
        } else {
           if (Date.now() - DATA.loadStarted > this.waitForSoundTime &&
                   DATA.loading("images") >= 1)

               DATA.loaded("images");
        }

        this.ticker++;
    },

    "start" : function() {

        this.stage = new Kinetic.Stage({
            container: 'game',
            width: SHAPE_X,
            height: SHAPE_Y
        });

        this.loadingLayer.add(new Kinetic.Text(
            {x: 10, y: 10, text: "LOADING...",
                stroke: "#5e0000", fontSize: 20}));
        this.loadingLayer.add(this.loadingWedge);
        this.stage.add(this.loadingLayer);

        var imgs = [
                //DATA-key, src, width, heigh
                {name: 0, file: "img/c0.png", callback: {method: "clickNavigate"}},
                {name: 1, file: "img/c1.png", callback: {method: "clickNavigate"}},
                {name: 2, file: "img/c2.png", callback: {method: "clickNavigate"}},
                {name: "player", file: "img/player.png", 
                 anim: {animations: {
                    standing: [
                        0, 0, 23, 29,
                        24, 0, 23, 29],
                    flying : [
                        48, 0, 26, 34]},
                    frameRate: 2,
                    animation: 'standing'
                }},
                {name: "goal", file: "img/goal.png"},
                {name: "mob", file: "img/mob.png",
                 anim: {animations: {
                    standing: [
                        0, 0, 27, 31,
                        27, 0, 32, 31,
                        60, 0, 26, 31
                    ]},
                    animation: 'standing'
                    }},
                {name: "coin", file: "img/coin.png"},
                {name: "title", file: "img/title.png"},
                {name: "startI", file:"img/startInactive.png",
                    callback: {method:"startNewGame"}},
                {name: "startA", file: "img/startActive.png",
                    callback: {method:"startNewGame"}},
                {name: "resumeI", file: "img/resumeInactive.png",
                    callback: {method:"hideMenu"}},
                {name: "resumeA", file: "img/resumeActive.png",
                    callback: {method:"hideMenu"}},
                {name: "menuCandy1", file: "img/menuCandy1.png"},
                {name: "menuCandy2", file: "img/menuCandy2.png"},
                {name: "menuCandy3", file: "img/menuCandy3.png"},
                {name: "theEnd", file: "img/theEnd.png"},
                {name: "cheat", file: "img/cheater.png"}];

        var snds = [
                ["coin", "sound/coin"],
                ["caught", "sound/caught"],
                ["starved", "sound/starved"],
                ["completed", "sound/lvlCompleted"],
                ["level", "sound/tune"]];


        DATA.imageTotal = imgs.length;
        DATA.musicTotal =  snds.length;
        DATA.loadStarted = Date.now();

        this.loadImages(imgs);
        this.loadSounds(snds);
        
        this.coinsText = $("#shards");
        JUMP_TO_FUNC = $.proxy(this, "setStateFromCode");
        CHEAT_FUNC = $.proxy(this, "skipLevel");
        REGRET_CHEAT_FUNC = $.proxy(this, "regretLastSkip");

        $("#jumpAction").on($.mobile.support.touch ? "tap" :"click", function() {
            JUMP_TO_FUNC();
        });

        $("#cheat").on($.mobile.support.touch ? "tap" : "click", function() {
            CHEAT_FUNC();
        });

        $("#regretCheat").on($.mobile.support.touch ? "tap" : "click", function() {
            REGRET_CHEAT_FUNC();
        });

        //Setting up callbacks
        var f = $.proxy(this, "draw");
        window.setInterval(f, 31);
        var f2 = $.proxy(this, "update");
        window.setInterval(f2, 33);

    }
}

var e = new Engine();
e.start();
function checkKey(ev) {    
    if (JUMP_TO_ELEM.is(":focus"))
        return true;

    var code = ev.keyCode || ev.witch;
    if (code == UP || code == 87)
        e.requestMove = UP;
    else if (code == RIGHT || code == 68)
        e.requestMove = RIGHT;
    else if (code == DOWN || code == 83)
        e.requestMove = DOWN;
    else if (code == LEFT || code == 65)
        e.requestMove = LEFT;
    else if (code == 82)
        e.death2();
    else if (code == 77)
        DATA.snds["level"].muted = !DATA.snds["level"].muted;
    else if (code == 80 || code == 27)
        e.showMenu();
    else if (code == ENTER || code == 32)
        e.requestMove = ENTER;
    else if (code == 49)
        e.rescale(1);
    else if (code == 50)
        e.rescale(2);
    else if (code == 51)
        e.rescale(3);
    else if (code == 52)
        e.rescale(4);
    else {
        console.log(code);
        return true;
    }
    ev.preventDefault();
    return false;
}

$(document).keydown (checkKey);
