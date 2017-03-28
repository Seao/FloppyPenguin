/* Author: Wolz Aurélien
 * Based on: http://codepen.io/anon/pen/JsHok
 */

/*********************************
 * VARIABLES
 ********************************/

var stage, w, h, loader, pipe1height, pipe2height, pipe3height, startX, startY, wiggleDelta;
var background, penguin, ground, pipe, bottomPipe, pipes, rotationDelta, counter, counterOutline;
var started = false;
var startJump = false;
var jumpAmount = 120;
var jumpTime = 266;
var dead = false;
var KEYCODE_SPACE = 32;
var gap = 250;
var masterPipeDelay = 78;
var pipeDelay = masterPipeDelay;
var counterShow = false;

document.onkeydown = handleKeyDown;

/*********************************
 * INITIALIZE
 ********************************/

function init() {

  // Create and add stage
  stage = new createjs.Stage("game");
  createjs.Touch.enable(stage);

  // Define variables
  w = stage.canvas.width;
  h = stage.canvas.height;

  assets = [
    // Pictures
    { src:"img/penguin.png", id:"penguin" },
    { src:"img/background.png", id:"background" },
    { src:"img/ground.png", id:"ground" },
    { src:"img/pipe.png", id:"pipe" },
    { src:"img/restart.png", id:"btnRestart" },
    { src:"img/share.png", id:"btnShare" }
  ];

  // Loading
  loader = new createjs.LoadQueue(false);
  loader.addEventListener("complete", handleComplete);
  loader.loadManifest(assets);
}

/*********************************
 * LOADING COMPLETED
 ********************************/

function handleComplete() {

  // Display the background
  background = new createjs.Shape();
  background.graphics.beginBitmapFill(loader.getResult("background")).drawRect(0,0,w,h);
  stage.addChild(background);

  // Display and move the ground
  var groundImg = loader.getResult("ground");
  ground = new createjs.Shape();
  ground.graphics.beginBitmapFill(groundImg).drawRect(0, 0, w+groundImg.width, groundImg.height);
  ground.tileW = groundImg.width;
  ground.y = h-groundImg.height;

  // Load, crop and create penguin's frame
  var data = new createjs.SpriteSheet({
    "images": [loader.getResult("penguin")],
    // Frames are important for penguin's rotation
    "frames": {"width": 92, "height": 64, "regX": 46, "regY": 32, "count": 3},
    // Define animations used
    "animations": {"fly": [0, 2, "fly", 0.21], "dive": [1, 1, "dive", 1]}
  });

  // Create penguin sprite with fly animation
  penguin = new createjs.Sprite(data, "fly");

  // Position variables
  startX = (w/2) - (92/2);
  startY = 512;
  wiggleDelta = 18;

  // Set initial position
  penguin.setTransform(startX, startY, 1, 1);
  penguin.framerate = 30;

  // Wiggle the penguin at the begining
  createjs.Tween.get(penguin, {loop:true}).to({y:startY + wiggleDelta}, 380, createjs.Ease.sineInOut).to({y:startY}, 380, createjs.Ease.sineInOut);

  // Prepare pipes
  pipes = new createjs.Container();
  stage.addChild(pipes);

  // Stage ground after pipes for the overlay
  stage.addChild(penguin, ground);

  // Handle jump
  stage.addEventListener("stagemousedown", handleJumpStart);

  // Prepare counter
  counter = new createjs.Text(0, "86px 'Arial'", "#ffffff");
  counterOutline = new createjs.Text(0, "86px 'Arial'", "#000000");
  counterOutline.outline = 5;
  counterOutline.textAlign = 'center';
  counter.textAlign = 'center';
  counterOutline.x = w/2;
  counterOutline.y = 150;
  counter.x = w/2;
  counter.y = 150;
  counter.alpha = 1;
  counterOutline.alpha = 1;
  stage.addChild(counter, counterOutline);

  // Ticker configuration
  createjs.Ticker.timingMode = createjs.Ticker.RAF;
  createjs.Ticker.addEventListener("tick", tick);
}

/*********************************
 * HANDLE KEYS PRESSED
 ********************************/

function handleKeyDown(e) {
  // Cross-browser issue retrieve event
  if(!e) {
    var e = window.event;
  }
  // If space, start jump function
  switch(e.keyCode) {
    case KEYCODE_SPACE: handleJumpStart();
  }
}

/*********************************
 * JUMP ACTION
 ********************************/

function handleJumpStart() {
  // If the penguin is not dead
  if (!dead) {
    // Clean penguin animations
    createjs.Tween.removeTweens(penguin);
    // Display jump animation
    penguin.gotoAndPlay("jump");
    startJump = true;
    if(!started) {
      started = true;
      counterShow = true;
    }
  }
}

/*********************************
 * DIE FUNCTION
 ********************************/

function die() {
  dead = true;

  // Update animation
  penguin.gotoAndPlay("dive");
  createjs.Tween.removeTweens(penguin);

  // Move the penguin down to the ground
  createjs.Tween.get(penguin).wait(0).to({y:penguin.y + 200, rotation: 90}, (380)/1.5, createjs.Ease.linear) // Rotate back
  .to({y:ground.y - 30}, (h - (penguin.y+200))/1.5, createjs.Ease.linear); // Drop to the bedrock

  // Prepare restart button
  btnRestart = new createjs.Bitmap(loader.getResult("btnRestart"));
  btnRestart.alpha = 0;
  btnRestart.x = w/2 - btnRestart.image.width/2;
  btnRestart.y = h/2 - btnRestart.image.height/2 - 150;
  stage.addChild(btnRestart);

  // Prepare share button
  btnShare = new createjs.Bitmap(loader.getResult("btnShare"));
  btnShare.alpha = 0;
  btnShare.x = w/2 - btnShare.image.width/2;
  btnShare.y = h/2 - btnShare.image.height/2 - 50;
  stage.addChild(btnShare);

  // Buttons apparition
  createjs.Tween.get(btnRestart).to({alpha:1, y: btnRestart.y + 50}, 400, createjs.Ease.sineIn);
  createjs.Tween.get(btnShare).to({alpha:1, y: btnShare.y + 50}, 400, createjs.Ease.sineIn);
  addButtonsListerner();
}

/*********************************
 * RESTART FUNCTION
 ********************************/

function restartGame() {

  // Remove all pipes
  pipes.removeAllChildren();
  createjs.Tween.get(btnRestart).to({y:btnRestart.y + 10}, 50).call(removeButtons);

  // Refresh variables
  counter.text = 0;
  counterOutline.text = 0;
  counterOutline.alpha = 0;
  counter.alpha = 0;
  counterShow = false;
  pipeDelay = masterPipeDelay;
  dead = false;
  started = false;
  startJump = false;

  // Prepare pinguin
  createjs.Tween.removeTweens(penguin);
  penguin.x = startX;
  penguin.y = startY;
  penguin.rotation = 0;
  createjs.Tween.get(penguin, {loop:true}).to({y:startY + wiggleDelta}, 380, createjs.Ease.sineInOut).to({y:startY}, 380, createjs.Ease.sineInOut);
}

/*********************************
 * BUTTON MANAGEMENT
 ********************************/

function removeButtons() {
  stage.removeChild(btnRestart);
  stage.removeChild(btnShare);
}

function addButtonsListerner() {
  btnRestart.addEventListener("click", restartGame);
  btnShare.addEventListener("click", shareScore);
}

/*********************************
 * SHARE FUNCTION
 ********************************/

function shareScore() {
  var countText
  if (counter.text == 1) {
    countText = "1 point"
  } else {
    countText = counter.text + " points"
  }
}

/*********************************
 * TICK TIMMING
 ********************************/

function tick(event) {
  // Variables
  var deltaS = event.delta/1000;
  var l = pipes.getNumChildren();

  // Collision detection
  if (penguin.y > (ground.y - 40)) {
    if(!dead) {
      die();
    }
    if(penguin.y > (ground.y - 30)) {
      createjs.Tween.removeTweens(penguin);
    }
  }

  // Move the ground
  if(!dead) {
    ground.x = (ground.x-deltaS*300) % ground.tileW;
  }

  // Game management
  if(started && !dead) {
    // Pipe apparitions
    if (pipeDelay == 0) {
      // Create a new pipe and add it
      pipe = new createjs.Bitmap(loader.getResult("pipe"));
      pipe.x = w+600;
      pipe.y = (ground.y - gap*2) * Math.random() + gap*1.5;
      pipes.addChild(pipe);

      // Create second pipe top
      pipe2 = new createjs.Bitmap(loader.getResult("pipe"));
      pipe2.scaleX = -1;
      pipe2.rotation = 180;
      pipe2.x = pipe.x;
      pipe2.y = pipe.y - gap;
      pipes.addChild(pipe2);

      // Reset the delay
      pipeDelay = masterPipeDelay;
    } else {
      // Decrement the delay
      pipeDelay = pipeDelay-1;
    }

    // Display current pipes
    for(var i=0; i<l; i++) {
      // Retrieve it
      pipe = pipes.getChildAt(i);
      if(pipe) {
        if(true) {
          var collision = ndgmr.checkRectCollision(pipe,penguin,1,true);
          if (collision) {
            if (collision.width > 8 && collision.height > 8) {
              die();
            }
          }
        }

        // Move pipe
        pipe.x = (pipe.x - deltaS*300);

        // Manage score counter when pipres passed
        if(pipe.x <= 338 && pipe.rotation == 0 && pipe.name != "counted") {
          pipe.name = "counted";
          counter.text = counter.text + 1;
          counterOutline.text = counterOutline.text + 1;
        }

        // Remove pipes out of the game
        if (pipe.x + pipe.image.width <= -pipe.w) {
          pipes.removeChild(pipe)
        }
      }
    }

    // Counter show properties
    if(counterShow) {
      counter.alpha = 1
      counterOutline.alpha = 1
      counterShow = false
    }
  }

  if(startJump) {
    startJump = false

    // Display penguin animation
    penguin.framerate = 60;
    penguin.gotoAndPlay("fly");

    // Rotation management()
    if (penguin.roation < 0) {
      rotationDelta = (penguin.rotation - 20)/5;
    } else {
      rotationDelta = (penguin.rotation + 20)/5;
    }

    // Limit position
    if (penguin.y < -200) {
      penguin.y = -200
    }

    createjs
    .Tween
    .get(penguin)
    .to({y:penguin.y - rotationDelta, rotation: -20}, rotationDelta, createjs.Ease.linear) // rotate to jump position and jump penguin
    .to({y:penguin.y - jumpAmount, rotation: -20}, jumpTime - rotationDelta, createjs.Ease.quadOut) // rotate to jump position and jump penguin
    .to({y:penguin.y}, jumpTime, createjs.Ease.quadIn) // reverse jump for smooth arch
    .to({y:penguin.y + 200, rotation: 90}, (380)/1.5, createjs.Ease.linear) //rotate back
    .to({y:ground.y - 30}, (h - (penguin.y+200))/1.5, createjs.Ease.linear); // drop to the bedrock

  }

  stage.update(event);
}
