// JavaScript source code
//<script>
var tiles = [];
var multiplesCount = 0;
var leftTiles = [];
var rightTiles = [];
var buttonsDrawn = [];
var theCanvas;
var mouseX, mouseY;
var touchX, touchY;
var scale = 10;
var cWidth, cHeight;
var cColour = "#ffffff";
var context;
var snap;
var letters = [0, "x", "y", "c", "ghost"];
var currentTile;
var dragging;
var addMenu = document.getElementById("addMenu");
var operationsMenu = document.getElementById("operationsMenu");
var multiplierNotice = document.getElementById("multiplierNotice");
var workings = document.getElementById("workings");
var content = document.getElementById("content");
var helpMenu = document.getElementById("helpMenu");
var levelSelectMenu = document.getElementById("levelSelectMenu");
var hintToast = document.getElementById("liveToast");
var alertDiv = document.getElementById("alertDiv");
var completeMenu = document.getElementById("completeMenu");
let hint = "";
let currentLevel = null;
let currentSubLevel = null;
let operationButtons = [document.getElementById("addbtn"), document.getElementById("minusbtn"), document.getElementById("timesbtn"), document.getElementById("divbtn")];

//first set for positives, second set for negatives, third set for borders
var tileColours = [["AliceBlue", "DarkBlue", "Blue"], ["LightGreen", "DarkGreen", "Green"], ["LightPink", "DarkRed", "Red"], ["Gold", "DarkGoldenRod", "GoldenRod"], ["rgba(0, 0, 0, 0.1)", "rgba(0, 0, 0, 0.1)", "rgba(0, 0, 0, 0.4)"], ["Turquoise", "Teal", "CadetBlue"]];

function init(equation) {
	theCanvas = document.getElementById("gameCanvas");
	context = theCanvas.getContext("2d");
	cWidth = 0.96 * content.offsetWidth;
	cHeight = 0.9 * window.innerHeight;
	context.canvas.width = cWidth;
	context.canvas.height = cHeight;
	scale = Math.min(cWidth, cHeight) / 10.5;

	snap = scale / 4;

	//drawLevel
	if (equation == null) {
		equation = "2x+5=4";
	}
	document.getElementById("newEquation").value = equation;
	newEquation();
	//drawScreen();

	//theCanvas.addEventListener("mousemove", highlightObject, false);
	theCanvas.addEventListener("mousedown", downListener, false);
	theCanvas.addEventListener('touchstart', downListener, false);
	theCanvas.addEventListener("dblclick", dblClick, false);

	alertDiv.setAttribute("class","d-none");
}

function createLevelSelect(){
	levelSelectMenu.innerHTML = '<div class="card - body"><button type = "button" class="btn-close" aria - label="Close" onclick = "closePopup(levelSelectMenu)" ></button ><h5 class="card-header text-bg-info">Levels:</h5></div >';
	levelSelectMenu.setAttribute("class","card position-absolute top-0 start-50 translate-middle-x text-bg-light border border-success d-inline w-75 mt-4");
	const cDecoded = decodeURIComponent(document.cookie);
	for (let i = 0; i < levels.length; i++) {
		let btn = document.createElement("button");
		btn.innerText = i;
		btn.setAttribute("class", "btn btn-info btn-lg m-4");
		
		//check if previous level complete
		if(i>0) {
			for(let j=0; j<levels[i-1].equations.length; j++) {
				if(!cDecoded.includes(i-1+"."+j+"=")) {
					btn.setAttribute("class", "btn btn-info btn-lg m-4 disabled");
					break;
				}
			}
		}
		levelSelectMenu.appendChild(btn);
		//add function for selecting a level
		btn.setAttribute("onClick","subLevelSelect("+i+")");
	}
}

function subLevelSelect(i) {
		levelSelectMenu.innerHTML = '<div class="card - body"><button type = "button" class="btn-close" aria - label="Close" onclick = "closePopup(levelSelectMenu)" ></button ><h5 class="card-header text-bg-primary">Sub-Levels:</h5>Complete all sub-levels to progress to the next level.</div ><button class="btn btn-info btn-lg m-4" onClick="createLevelSelect()">&#9754;';
		const cDecoded = decodeURIComponent(document.cookie);
		for (let j=0; j< levels[i].equations.length; j++) {
			let btn = document.createElement("button");
			btn.innerHTML = i+"."+j;
			btn.setAttribute("class", "btn btn-primary btn-lg m-4");
			if(cDecoded.includes(i+"."+j+"=")){
				btn.setAttribute("class", "btn btn-success btn-lg m-4");
				btn.innerHTML += "&#10004;";
			} else {
				btn.setAttribute("class", "btn btn-primary btn-lg m-4");
				btn.innerHTML += "&#10060;";
			}
			btn.setAttribute("onClick","setupLevel("+i+","+j+")");
			levelSelectMenu.appendChild(btn);
		}
}

function setupLevel(level,subLevel) {
		closePopup(levelSelectMenu);
		init(levels[level].equations[subLevel]);
		alertDiv.setAttribute("class", "alert alert-danger d-flex align-items-center position-fixed bottom-0 start-0 m-3 opacity-"+(100-25*Math.min(3,Math.floor(subLevel/2))));
		alertDiv.innerHTML = "&#10069; "+levels[level].text + '<button type="button" class="btn-close" onclick="alertDiv.setAttribute(\'class\',\'d-none\');" aria-label="Close"></button';
		currentLevel = level;
		currentSubLevel = subLevel;
		
		//block unneeded buttons
		//todo Big heading for each new level
	for (let i = 0; i < 4; i++) {
		operationButtons[i].disabled = levels[level].buttonsDisabled[i];
	}
}

function drawScreen() {
	//Whole Board colouring	
	context.fillStyle = cColour;
	content.style.background = cColour;
	context.fillRect(0, 0, cWidth, cHeight);
	context.lineWidth = 3;
	context.strokeStyle = "black";
	context.beginPath();
	context.rect(0, 0, cWidth, cHeight);

	//Darken left half
	context.fillStyle = "rgba(0, 0, 0, 0.1)";
	context.fillRect(0, 0, cWidth / 2, cHeight);

	//Add line down middle
	context.setLineDash([5, 3]);
	context.moveTo(cWidth / 2, 0);
	context.lineTo(cWidth / 2, cHeight);
	context.stroke();
	context.closePath();

	//Add equals sign
	context.fillStyle = "rgb(0,0,0)";
	context.fillRect(cWidth * 0.46, cHeight * 0.35, cWidth * 0.08, cHeight * 0.02);
	context.fillRect(cWidth * 0.46, cHeight * 0.39, cWidth * 0.08, cHeight * 0.02);

	for (let i = 0; i < tiles.length; i++) {
		if (tiles[i].tile == null) {
			snapShape(tiles[i]);
		}
		tiles[i].display();
	}

}

function snapShape(obj) {
	obj.x = Math.round(obj.x / snap) * snap;
	obj.y = Math.round(obj.y / snap) * snap;
}

function Multiplier(tile, number, divisor) {
	this.ghost = false;
	this.height = scale;
	this.tile = tile;
	this.multiplier = null;
	multiplesCount++;
	tiles.push(this)
	tile.multiplier = this;
	this.divisor = divisor;
	var width = Math.log10(Math.abs(number));
	if (number < 0) {
		width++;
	} else if (number == 0) {
		this.ghost = true;
	}
	this.width = this.height * (Math.max(1, 0.5 * width));
	if (!divisor) {
		this.x = tile.x - this.width;
		this.y = tile.y;
	} else {
		this.x = (tile.x + tile.width / 2) - this.width / 2;
		this.y = tile.y + tile.height;
	}
	this.startX = this.x;
	this.startY = this.y;
	if (this.x < cWidth / 2) {
		this.maxX = cWidth / 2 - this.width;
		this.minX = 0;
	} else {
		this.minX = cWidth / 2;
		this.maxX = cWidth - this.width * 2;
	}
	this.number = number;
	this.display = function () {
		if (this.divisor) {
			context.lineWidth = 3;
			context.strokeStyle = "black";
			context.beginPath();
			context.moveTo(Math.min(this.startX, this.tile.x), this.startY);
			context.lineTo(Math.max(this.startX + this.width, this.tile.x + this.tile.width), this.startY);
			context.stroke();
			context.closePath();
		}
		var i = 0;
		var textColour = "black";
		context.fillStyle = "Plum";
		context.strokeStyle = "Purple";
		context.setLineDash([]);
		if (this.number < 0) {
			i = 1;
			textColour = "white";
			context.fillStyle = "RebeccaPurple";
		} else if (this.ghost) {
			context.fillStyle = tileColours[4][0];
			context.strokeStyle = tileColours[4][2];
			context.setLineDash([5, 3]);
		}
		context.lineWidth = 1;


		context.beginPath();
		context.rect(this.x, this.y, this.width, this.height);
		context.closePath();
		context.fill();
		context.stroke();
		context.lineWidth = 1;
		if (!this.ghost) {
			context.strokeStyle = textColour;
			context.beginPath();
			context.fillStyle = textColour;
			var fontSize = (this.height * 0.8);
			context.font = fontSize + "px Arial";
			var text = "" + this.number;
			context.fillText(text, this.x + (this.width - context.measureText(text).width) / 2, this.y + this.height / 2 + fontSize / 2.5);
			context.fill();
			context.closePath();
		}
	};
}

function Tile(letter, coefficient, denominator, power, leftSide) {
	this.setUpTextAndDimensions = function () {
		this.textColour = "black";
		if (this.coefficient < 0) {
			this.textColour = "white";
		}

		if (this.denominator == 1) {
			this.height = scale;
			context.font = this.height * 0.8 + "px Arial";
		} else {
			this.height = 1.5 * scale;
			context.font = this.height * 0.8 * 0.75 + "px Arial";
		}

		this.text = "";
		if (this.letter == 0) {
			this.text += this.coefficient;
		} else {
			if (this.coefficient == 1) {
			} else if (this.coefficient == -1) {
				this.text += "-";
			} else {
				this.text += this.coefficient;
			}
			if (this.letter == 5) {
				this.text += "(" + this.bracket + ")";
			} else {
				this.text += letters[this.letter];
			}
		}
		if (this.letter == 4) { this.text = ""; }
		this.width = Math.max(context.measureText(this.text).width + 5, context.measureText(denominator).width + 5, this.height);
	};

	//Set props
	if (typeof letter == "string") {
		this.letter = 5;
		this.bracket = letter;
	} else {
		this.letter = letter;
	}
	if (this.letter == 4) {
		this.ghost = true;
	} else {
		this.ghost = false;
	}
	this.multiplier = null;
	this.tile = null;
	this.leftSide = leftSide;
	this.coefficient = coefficient;
	this.denominator = denominator;
	this.setUpTextAndDimensions();
	this.power = power;

	//Set position
	if (leftSide) {
		this.maxX = cWidth / 2 - this.width;
		this.minX = 0;

		if (leftTiles.length > 0) {
			if (leftTiles[leftTiles.length - 1].x + leftTiles[leftTiles.length - 1].width + 2.5 * scale + this.width > cWidth / 2) {
				this.x = scale * 2.5;
				this.y = (leftTiles[leftTiles.length - 1].y + scale * 2.5)%cHeight;
			} else {
				this.x = leftTiles[leftTiles.length - 1].x + leftTiles[leftTiles.length - 1].width + 2.5 * scale;
				this.y = leftTiles[leftTiles.length - 1].y;
			}
		} else {
			this.x = scale * 2.5;
			this.y = scale;
		}
		leftTiles.push(this);
	} else {
		this.minX = cWidth / 2;
		this.maxX = cWidth - this.width;

		if (rightTiles.length > 0) {
			if (rightTiles[rightTiles.length - 1].x + rightTiles[rightTiles.length - 1].width + 2.5 * scale + this.width > cWidth) {
				this.x = cWidth / 2 + scale * 2.5;
				this.y = rightTiles[rightTiles.length - 1].y + scale * 2.5;
			} else {
				this.x = rightTiles[rightTiles.length - 1].x + rightTiles[rightTiles.length - 1].width + 2.5 * scale;
				this.y = rightTiles[rightTiles.length - 1].y;
			}
		} else {
			this.x = cWidth / 2 + scale * 2.5;
			this.y = scale;
		}
		rightTiles.push(this);
	}
	this.startX = this.x;
	this.startY = this.y;

	//Add to list of tiles
	tiles.push(this);

	this.display = function () {
		this.setUpTextAndDimensions();
		var i = 0;
		if (this.coefficient < 0) {
			i = 1;
		}
		context.fillStyle = tileColours[this.letter][i];
		context.lineWidth = 1;
		if (this.letter == 4) {
			context.setLineDash([5, 3]);
		} else {
			context.setLineDash([]);
		}
		context.strokeStyle = tileColours[this.letter][2];
		context.beginPath();
		context.rect(this.x, this.y, this.width, this.height);
		context.fill();
		context.stroke();
		context.closePath();
		if (this.letter != 4) {
			context.lineWidth = 1;
			context.beginPath();
			context.fillStyle = this.textColour;
			context.strokeStyle = this.textColour;
			if (this.denominator == 1) {
				context.fillText(this.text, this.x + (this.width - context.measureText(this.text).width) / 2, this.y + this.height / 2 + this.height * 0.8 / 2.5);

			} else {
				context.fillText(this.text, this.x + (this.width - context.measureText(this.text).width) / 2, this.y + this.height / 3 + this.height * 0.8 * 0.75 / 5);
				context.fillText(this.denominator, this.x + (this.width - context.measureText(this.denominator).width) / 2, this.y + 2 * this.height / 3 + this.height * 0.8 * 0.75 / 3 + 8);
				context.fillRect(this.x + (this.width - context.measureText(this.text).width) / 2, this.y + this.height / 3 + this.height * 0.8 * 0.75 / 5 + 2, context.measureText(this.text).width, 2);
			}
			context.fill();
			context.closePath();
		}
	};
}

//a is the obejct b is the mouse coordinates
function near(a, b) {
	if (a.x + a.width > b.x && a.x < b.x) {
		if (a.y + a.height > b.y && a.y < b.y) {
			return true;
		}
	}
	return false;
}

function hitTest(shape, x, y) {
	if (near(shape, { x: x, y: y })) {
		return true;
	}
	return false;
}

function downListener(e) {
	//var i;
	dragging = false;
	let mouseE = e.button === 0 ? true : false;
	getMousePos(e);
	getTouchPos(e);
	for (let i = 0; i < tiles.length; i++) {
		if ((hitTest(tiles[i], mouseX, mouseY) && mouseE) || hitTest(tiles[i], touchX, touchY)) {
			if ((multiplesCount <= 0 || tiles[i].tile != null) && !tiles[i].ghost) {
				if (tiles[i].coefficient == 0) {
					removeTile(tiles[i]);

					//addworkings
					addWorking();
					break;
				}
				currentTile = tiles[i];
				tiles.splice(i, 1);
				tiles.push(currentTile);
				dragging = true;
				break;
			}
		}
	}

	if (dragging) {
		window.addEventListener("mousemove", mouseMoveListener, false);
		window.addEventListener("touchmove", touchMoveListener, false);
		drawScreen();
	} else {
		/*selecting = true;
		window.addEventListener("mousemove", selectmove, false);
		window.addEventListener("touchmove", selectmove, false);
		drag = new DragSelect();*/
		currentTile = null;
	}
	theCanvas.removeEventListener("mousedown", downListener, false);
	theCanvas.removeEventListener("touchstart", downListener, false);
	window.addEventListener("mouseup", upListener, false);
	window.addEventListener("touchend", upListener, false);
	e.preventDefault();
}

function mouseMoveListener(e) {
	getMousePos(e);
	currentTile.x = Math.max(Math.min(mouseX - currentTile.width / 2, currentTile.maxX), currentTile.minX);
	currentTile.y = mouseY - currentTile.height / 2;
	drawScreen();
}

function touchMoveListener(e) {
	getTouchPos(e);
	currentTile.x = Math.max(Math.min(touchX - currentTile.width / 2, currentTile.maxX), currentTile.minX);
	currentTile.y = touchY - currentTile.height / 2;
	drawScreen();
}

function upListener(e) {
	theCanvas.addEventListener("mousedown", downListener, false);
	theCanvas.addEventListener("touchstart", downListener, false);
	window.removeEventListener("mouseup", upListener, false);
	window.removeEventListener("touchend", upListener, false);
	dragging = false;
	window.removeEventListener("mousemove", mouseMoveListener, false);
	window.removeEventListener("touchmove", touchMoveListener, false);

	if (currentTile != null && !multiplierDrop(currentTile) && !likeTermDrop(currentTile) && currentTile.coefficient == null) {
		currentTile.x = currentTile.startX;
		currentTile.y = currentTile.startY;
	}
	drawScreen();
}

//if multiplier dropped over its term, multiply coefficient of term by multiplier and delete the multiplier
function multiplierDrop(tile) {
	var tileMidX = tile.x + tile.width / 2;
	var tileMidY = tile.y + tile.height / 2;
	if (tile.tile == null ||
		tileMidX < tile.tile.x ||
		tileMidX > (tile.tile.x + tile.tile.width) ||
		tileMidY < tile.tile.y ||
		tileMidY > (tile.tile.y + tile.tile.height)) {
		return false;
	}

	if (tile.divisor) {
		tile.tile.denominator = tile.tile.denominator * tile.number;
	} else {
		tile.tile.coefficient = tile.tile.coefficient * tile.number;
	}
	simplify(tile.tile);
	tile.tile.multiplier = null;

	removeTile(tile);
	multiplesCount--;

	//if no more multipliers go back to operationsMenu
	for (let i = 0; i < tiles.length; i++) {
		if (tiles[i].coefficient == null) {
			return true;
		}
	}
	multiplierNotice.setAttribute("class", "d-none");
	operationsMenu.setAttribute("class", "row bg-success bg-opacity-25 border border-success");

	//addworkings
	addWorking();

	return true;
}

//if the tile is dropped over a like term then add the coefficient to the like term, delete the tile, return true
function likeTermDrop(tile) {
	var likeTerm = overLikeTerm(tile);
	if (likeTerm != null) {
		likeTerm.coefficient = likeTerm.coefficient * tile.denominator + tile.coefficient * likeTerm.denominator;
		likeTerm.denominator = likeTerm.denominator * tile.denominator;
		simplify(likeTerm);
		removeTile(tile);

		//addworkings
		addWorking();
		return true;
	}
	return false;
}

function overLikeTerm(tile) {
	var tileMidX = tile.x + tile.width / 2;
	var tileMidY = tile.y + tile.height / 2;

	for (let i = 0; i < tiles.length; i++) {
		if (tile !== tiles[i] &&
			tileMidX > tiles[i].x &&
			tileMidX < (tiles[i].x + tiles[i].width) &&
			tileMidY > tiles[i].y &&
			tileMidY < (tiles[i].y + tiles[i].height) &&
			tile.letter == tiles[i].letter &&
			tile.bracket == tiles[i].bracket) {
			return tiles[i];
		}
	}
	return null;
}

function getMousePos(e) {
	if (!e) {
		var e = event;
	}
	if (e.offsetX) {
		mouseX = e.offsetX;
		mouseY = e.offsetY;
	} else if (e.layerX) {
		mouseX = e.layerX;
		mouseY = e.layerY;
	}
}

function getTouchPos(e) {
	if (!e)
		var e = event;
	if (e.touches) {
		if (e.touches.length === 1) { // Only deal with one finger
			var touch = e.touches[0]; // Get the information for finger #1
			touchX = touch.pageX - touch.target.offsetLeft;
			touchY = touch.pageY - touch.target.offsetTop;
		}
	}
}

function dblClick(e) {
	mouseE = e.button === 0 ? true : false;
	getMousePos(e);
	getTouchPos(e);
	dragging = false;

	for (let i = 0; i < tiles.length; i++) {
		if ((hitTest(tiles[i], mouseX, mouseY) && mouseE) || hitTest(tiles[i], touchX, touchY)) {
			if (multiplesCount <= 0 && tiles[i].letter == 5) {
				//split bracket into individual tiles
				var j = tiles.length;

				if (leftTiles[leftTiles.length - 1] === tiles[i]) {
					leftTiles.splice(leftTiles.length - 1, 1);
				} else if (rightTiles[rightTiles.length - 1] === tiles[i]) {
					rightTiles.splice(rightTiles.length - 1, 1);
				}

				createTiles(tiles[i].bracket, tiles[i].leftSide);
				var k = tiles.length;
				//multiply the tiles by the coeff divide by the denom
				while (j < k) {
					if (tiles[i].coefficient != 1) {
						new Multiplier(tiles[j], tiles[i].coefficient, false);
					}
					if (tiles[i].denominator != 1) {
						new Multiplier(tiles[j], tiles[i].denominator, true);
					}
					j++
				}
				removeTile(tiles[i]);
				backToMultiplierNotice();
				break;
			}
		}
	}

}

function simplify(tile) {
	var gcd = function gcd(a, b) {
		return b ? gcd(b, a % b) : a;
	};
	gcd = gcd(tile.coefficient, tile.denominator);
	tile.coefficient = tile.coefficient / gcd;
	tile.denominator = tile.denominator / gcd;
	if (tile.denominator < 0) {
		tile.denominator *= -1;
		tile.coefficient *= -1;
	}
	drawScreen();
}

function showAddMenu(addsub) {
	removeTile("ghost");
	//If there are any multipliers, pop-up "remove multipliers first"
	for (let i = 0; i < tiles.length; i++) {
		if (tiles[i].number === null) {
			multiplierNotice.setAttribute("class", "row bg-success bg-opacity-25 border border-success");
			operationsMenu.setAttribute("class", "d-none");
			return;
		}
	}


	//Empty div
	addMenu.innerHTML = "";

	//Create buttons
	buttonsDrawn = [];
	addBackButton(addMenu);
	var letter = 0;
	for (let i = 0; i < tiles.length; i++) {
		if (tiles[i].letter != 5) {
			letter = tiles[i].letter;
		} else {
			letter = tiles[i].bracket;
		}
		appendAddSubButton(tiles[i].coefficient, tiles[i].denominator, letter, addsub);
	}

	//Replace opmenu with addmenu
	addMenu.setAttribute("class", "row bg-danger bg-opacity-25 border border-danger")
	operationsMenu.setAttribute("class", "d-none");

	//Add ghosts
	new Tile(4, 0, 1, 1, true);
	new Tile(4, 0, 1, 1, false);
	drawScreen();


}

function showTimesMenu(timesdiv) {
	removeTile("ghost");
	//If there are any multipliers, pop-up "remove multipliers first"
	for (let i = 0; i < tiles.length; i++) {
		if (tiles[i].number === null) {
			multiplierNotice.setAttribute("class", "row bg-success bg-opacity-25 border border-success");
			operationsMenu.setAttribute("class", "d-none");
			return;
		}
	}

	//Empty div
	addMenu.innerHTML = "";

	//Create buttons
	buttonsDrawn = [];
	addBackButton(addMenu);

	//times -1 always an option
	if (!timesdiv) {
		appendTimesDivButton(-1, -1, true);
	}
	for (let i = 0; i < tiles.length; i++) {
		appendTimesDivButton(tiles[i].coefficient, tiles[i].denominator, !timesdiv);

		//Add ghosts
		if (tiles[i].coefficient != null) {
			new Multiplier(tiles[i], 0, timesdiv);
		}
	}
	//new Multiplier(tiles[0],6,true);
	drawScreen();

	//Replace opmenu with addmenu
	addMenu.setAttribute("class", "row bg-danger bg-opacity-25 border border-danger");
	operationsMenu.setAttribute("class", "d-none");

}

function addSubtract(coefficient, letter, denominator) {

	//Change ghosts to the tiles with the value of button
	for (let i = 0; i < tiles.length; i++) {
		if (tiles[i].ghost) {
			if (typeof letter == "string") {
				tiles[i].letter = 5;
				tiles[i].bracket = letter;
			} else {
				tiles[i].letter = letter;
			}
			//tiles[i].letter = letter;
			tiles[i].coefficient = coefficient;
			tiles[i].denominator = denominator;
			tiles[i].ghost = false;
		}
	}
	drawScreen();
	addWorking();
	backToMultiplierNotice();
}

function timesDivide(number) {
	for (let i = 0; i < tiles.length; i++) {
		if (tiles[i].ghost) {
			tiles[i].number = number;
			tiles[i].ghost = false;
		}
	}
	drawScreen();
	backToMultiplierNotice();
}


function backToMultiplierNotice() {
	removeTile("ghost");
	addMenu.setAttribute("class", "d-none");
	operationsMenu.setAttribute("class", "row bg-success bg-opacity-25 border border-success");
	for (let i = 0; i < tiles.length; i++) {
		if (tiles[i].coefficient == null) {
			multiplierNotice.setAttribute("class", "row bg-info bg-opacity-25 border border-info");
			operationsMenu.setAttribute("class", "d-none");
		}
	}


	//remove ghost tiles
	removeTile("ghost");

	drawScreen();
}

function removeTile(tile) {
	if (tile == "ghost") {
		for (let i = 0; i < tiles.length; i++) {
			if (tiles[i].ghost) {
				tiles.splice(i, 1);
				i -= 1;
			}
		}
		for (let i = 0; i < leftTiles.length; i++) {
			if (leftTiles[i].ghost) {
				delete leftTiles[i];
				leftTiles.splice(i, 1);

				i -= 1;
			}
		}
		for (let i = 0; i < rightTiles.length; i++) {
			if (rightTiles[i].ghost) {
				delete rightTiles[i];
				rightTiles.splice(i, 1);

				i -= 1;
			}
		}
	} else {
		for (let i = 0; i < leftTiles.length; i++) {
			if (leftTiles[i] === tile) {
				leftTiles.splice(i, 1);
				break;
			}
		}
		for (let i = 0; i < rightTiles.length; i++) {
			if (rightTiles[i] === tile) {
				rightTiles.splice(i, 1);
				break;
			}
		}
		for (let i = 0; i < tiles.length; i++) {
			if (tiles[i] === tile) {
				delete tiles[i];
				tiles.splice(i, 1);

				break;
			}
		}
	}
	drawScreen();
}

function appendAddSubButton(coefficient, denominator, letter, addsub) {
	if (coefficient == null) {
		return;
	}

	var titleText = "";
	var coeff = "";
	const colours = ["primary", "success", "danger", "warning", "info"]
	switch (addsub) {
		case 0:
			titleText = "+";
			coeff = Math.abs(coefficient);
			break;
		case 1:
			titleText = "-";
			coeff = "-" + Math.abs(coefficient);
			break;
		default:
			break;
	}
	if (letter == 0 || (Math.abs(coefficient) != 1 || denominator != 1)) {
		titleText = titleText + Math.abs(coefficient);
	}
	if (typeof letter == "string") {
		titleText += "(" + letter + ")";
	} else if (letter != 0) {
		titleText = titleText + letters[letter];
	}
	if (denominator != 1) {
		titleText = titleText + "/" + denominator;
	}

	if (buttonsDrawn.includes(titleText)) { return; }

	//<div class="col p-1 text-center"><input class="btn btn-success btn-lg" type="button" title="Add" value="+" onClick="showAddMenu(0)" /></div>
	var newDiv = document.createElement("div");
	newDiv.setAttribute("class", "col p-1 text-center");

	var btn = document.createElement("button");
	addMenu.appendChild(newDiv);
	newDiv.appendChild(btn)
	btn.innerHTML = titleText;
	btn.setAttribute("title", titleText);
	if (typeof letter == "string") {
		letter = "'" + letter + "'";
	}
	btn.setAttribute("onClick", "addSubtract(" + coeff + "," + letter + "," + denominator + ")");
	if (typeof letter == "string") {
		letter = 4;
	}
	btn.setAttribute("class", "btn btn-" + colours[letter] + " btn-lg");
	buttonsDrawn.push(titleText);
}

function appendTimesDivButton(coefficient, denominator, timesdiv) {
	if (coefficient == null) { return; }

	var titleText = ""
	var number = 0;
	if (timesdiv) {
		titleText = "x" + denominator;
		number = denominator;
	} else {
		titleText = "&#247;" + coefficient;
		number = coefficient;
	}

	if (buttonsDrawn.includes(titleText)) { return; }
	//<div class="col p-1 text-center"><input class="btn btn-success btn-lg" type="button" title="Add" value="+" onClick="showAddMenu(0)" /></div>
	var newDiv = document.createElement("div");
	newDiv.setAttribute("class", "col p-1 text-center");

	var btn = document.createElement("button");
	newDiv.appendChild(btn);
	addMenu.appendChild(newDiv);
	btn.innerHTML = titleText;
	btn.setAttribute("title", titleText);
	btn.setAttribute("onClick", "timesDivide(" + number + ")");
	btn.setAttribute("class", "btn btn-lg btn-primary");

	buttonsDrawn.push(titleText);
}

function addBackButton(div) {
	//<div class="col p-1 text-center"><input class="btn btn-success btn-lg" type="button" title="Add" value="+" onClick="showAddMenu(0)" /></div>
	var newDiv = document.createElement("div");
	newDiv.setAttribute("class", "col p-1 text-center");
	var btn = document.createElement("button");
	btn.innerHTML = "&#9754;";
	btn.setAttribute("title", "back");
	btn.setAttribute("onClick", "backToMultiplierNotice()");
	btn.setAttribute("class", "btn btn-info btn-lg")
	newDiv.appendChild(btn);
	div.appendChild(newDiv);
}

function newEquation() {
	var newEquationString = document.getElementById("newEquation").value;

	const allowedCharacters = "0123456789-+/=xyc()";
	const allowedLetters = "xyc";
	//check string for correct syntax
	for (let i = 0; i < newEquationString.length; i++) {
		if (!allowedCharacters.includes(newEquationString[i])) {
			alert("Only the following characters are allowed: " + allowedCharacters);
			return;
		}
	}
	if (!newEquationString.includes("=") || newEquationString.match(/=/g).length != 1) {
		alert("Equations must contain one equals sign!");
		return;
	}


	//delete all Tiles
	while (tiles.length > 0) {
		removeTile(tiles[0]);
	}
	multiplesCount = 0;



	//parse string and create tiles
	var leftright = newEquationString.split("=")
	createTiles(leftright[0], true);
	createTiles(leftright[1], false);

	//remove old workings
	workings.innerHTML = "<h3>Workings</h3>";
	//start new workings
	addWorking();

	//enable all buttons
	for (let i = 0; i < 4; i++) {
		operationButtons[i].disabled = false;
	}

	drawScreen();

}

function enterPressed(click) {
	if (event.keyCode == 13 || click) {
		currentLevel = null;
		currentSubLevel = null;
		newEquation();
	}
}

function createTiles(expression, side) {
	var done = false;
	while (!done) {
		//get indices
		var plusIndex = (expression.substring(1).indexOf("+") + 100) % 100 + 1;
		var minusIndex = (expression.substring(1).indexOf("-") + 100) % 100 + 1;
		var bracketIndex = (expression.indexOf("(") + 100) % 100;
		var i = Math.min(plusIndex, minusIndex);
		var singleTerm = expression;
		//check for bracketted expressions
		if (i >= 99 && bracketIndex >= 99) {
			done = true;
		} else if (bracketIndex < i) {
			//find matching closing bracket, i
			let depth = 1;
			let bracketFound = false;
			for (let j = bracketIndex + 1; j < expression.length; j++) {
				if (expression.charAt(j) == "(") {
					depth++;
				} else if (expression.charAt(j) == ")") {
					depth--;
					if (depth == 0) {
						i = j;
						bracketFound = true;
						break;
					}
				}
			}
			if (!bracketFound) {
				alert("Make sure you close any opened brackets");
			
			//i = expression.indexOf(")");
			
			//if (i == -1) {
			//	alert("Make sure you close any opened brackets");
			} else {

				if (singleTerm.charAt(i + 1) == "/") {
					var nextPlus = (expression.substring(1).indexOf("+", i + 1) + 100) % 100 + 1;
					var nextMinus = (expression.substring(1).indexOf("-", i + 1) + 100) % 100 + 1;
					i = Math.min(nextPlus, nextMinus, expression.length);
				}

				singleTerm = expression.substring(0, i+1);
				if (i >= expression.length - 1) {
					done = true;
				}
				i++;
			}
		} else {
			singleTerm = expression.substring(0, i);
		}

		var coefficient = 1;
		var denominator = 1;
		if (singleTerm.includes("/")) {
			coefficient = parseInt(singleTerm.substring(0, singleTerm.indexOf("/")));
			if(isNaN(coefficient)) {
				if(singleTerm.substring(0, singleTerm.lastIndexOf("/")).includes("-")){
					coefficient = -1;
				} else {
					coefficient = 1;
				}
			}
			denominator = parseInt(singleTerm.substring(singleTerm.lastIndexOf("/") + 1));
		} else {
			coefficient = parseInt(singleTerm);
			if(isNaN(coefficient)) {
				if(singleTerm.includes("-")){
					coefficient = -1;
				} else {
					coefficient = 1;
				}
			}
		}
		if (isNaN(coefficient)) { coefficient = 1; }
		if (singleTerm.charAt(0) == "+" || singleTerm.charAt(0) == "-") {
			singleTerm = singleTerm.substring(1);
		}

		if (singleTerm.includes("+") || singleTerm.includes("-")) {
			new Tile(singleTerm.substring(singleTerm.indexOf("(") + 1, singleTerm.lastIndexOf(")")), coefficient, denominator, 1, side);
		} else if (singleTerm.includes("x")) {
			new Tile(1, coefficient, denominator, 1, side);
		} else if (singleTerm.includes("y")) {
			new Tile(2, coefficient, denominator, 1, side);
		} else if (singleTerm.includes("c")) {
			new Tile(3, coefficient, denominator, 1, side);
		} else {
			new Tile(0, coefficient, denominator, 1, side);
		}
		if (done) { break };
		expression = expression.substring(i);
	}
}

function addWorking() {
	var text = "\\(";
	var first = true;
	if (leftTiles.length == 0) {
		text += "0";
	} else {
		for (let i = 0; i < leftTiles.length; i++) {
			if (i == 0) { first = true; } else { first = false; }
			text += parseTile(leftTiles[i], first);
		}
	}
	text += "=";
	if (rightTiles.length == 0) {
		text += "0";
	} else {
		for (let i = 0; i < rightTiles.length; i++) {
			if (i == 0) { first = true; } else { first = false; }
			text += parseTile(rightTiles[i], first);
		}
	}

	text += "\\)";
	var nextLine = document.createElement("p");
	nextLine.innerText = text;
	workings.appendChild(nextLine);
	MathJax.typeset([nextLine]);
	cCheck();
}

function parseTile(tile, first) {
	if (tile.coefficient == null || tile.ghost) { return ""; }

	var text = "";
	if (tile.coefficient < 0) {
		text += "-";
	} else {
		if (!first) {
			text += "+";
		}
	}
	var fraction = false;
	if (tile.denominator != 1 || (tile.multiplier != null && tile.multiplier.divisor && !tile.multiplier.ghost)) {
		fraction = true;
		text += " \\frac{";
	}
	if (tile.multiplier != null && !tile.multiplier.divisor && !tile.multiplier.ghost) {
		var text = text + tile.multiplier.number + "\times";
	}

	if (Math.abs(tile.coefficient) != 1 || tile.letter == 0) {
		text += Math.abs(tile.coefficient);
	}

	if (tile.letter == 5) {
		text += "(" + tile.bracket + ")";
	} else if (tile.letter != 0) {
		text += letters[tile.letter];
	}

	if (fraction) {
		if (tile.denominator == 1) {
			text += "}{" + tile.multiplier.number + "}";
		} else {
			text += "}{";
			if (tile.multiplier != null && tile.multiplier.divisor && !tile.multiplier.ghost) {
				text += tile.multiplier.number + "\times";
			}
			text += tile.denominator + "}";
		}
	}
	return text;
}

function closePopup(menu) {
	menu.setAttribute("class", "d-none");
}

function openPopup(menu) {
	menu.setAttribute("class", "card position-absolute top-0 start-50 translate-middle-x text-bg-light border border-info d-inline w-75 mt-2");
}

function toastHint() {
	closePopup(helpMenu);
	const toast = new bootstrap.Toast(hintToast);
	document.getElementById("hintText").innerHTML = '<div class="toast-body" id="hintText">'+hint+'</div>';
    toast.show();
}

let levels = [
	{
		levelnumber: 0,
		text: "NEW CONCEPT - Rule 0: Adding zero lots of anything does not change the value of an expression. Click on the zeros to delete that term",
		equations: ["x+0=5", "-9+0=0+x", "x+0c=6c+0", "0c+x+0=0y+0+9/4", "3y-2+0=x+0"],
		buttonsDisabled: [true,true,true,true]
	},
	{
		levelnumber: 1,
		text: "NEW CONCEPT - Rule 1: Simplify an expression by collecting like terms. Drag a tile onto a like term to add them together",
		equations: ["x=3+2", "3y+5y=x", "x+0=5+3x-3x", "5-2y/5+3+2y/5=5x-4x+0", "11+c-2c=-5y+4x-3x+5y+0c","2x+2x-5y-4x=5x+2y-2x-2y-2x"],
		buttonsDisabled: [true, true, true, true]
	},
	{
		levelnumber: 2,
		text: "NEW CONCEPT - Rule 2: Use the subtract button to take away any terms that are on the same side as the x",
		equations: ["x+3=5", "11=2+x","x+c=c+4","x+2/3=1", "0+9c=x+3c", "x+5=-2y+11+2y","5x+6-4x=3+0", "19=y+x+5"],
		buttonsDisabled: [true, false, true, true]
	},
	{
		levelnumber: 3,
		text: "NEW CONCEPT - Rule 3: Use the add button to cancel out any negative terms that are on the same side as the x",
		equations: ["x-1=19", "4=x-2", "5+c=x-9-c","x-5/3=2/3","5+x-y=13-y","5x-2y-4x=y/3+4","2=5+x-2c"],
		buttonsDisabled: [false, false, true, true]
	},
	{
		levelnumber: 4,
		text: "NEW CONCEPT - Rule 4: Divide the equation by the number of x's to reduce down to 1x",
		equations: ["11x=7", "16c=4x", "5+c=3x","2x-5/3=2/3","4x+3=11","19+6c=2x-1","11-2x+4c=4c"],
		buttonsDisabled: [false, false, true, false]
	},
	{
		levelnumber: 5,
		text: "NEW CONCEPT - Rule 5: Multiply the equation by the denominator of x to remove it",
		equations: ["x/11=9", "4=x/2", "5-c=x/5-4-c","x/3+7=2/6","5+x/10-y=13-y","5x/3=15","2=3x/2-2"],
		buttonsDisabled: [false, false, false, false]
	},
	{
		levelnumber: 6,
		text: "NEW CONCEPT - Rule 6: Multiply the equation by -1 to make a negative x positive",
		equations: ["-x-1=-8", "4=-x-2", "5+c=-x/5+9-c","-2x/7-5=2","5-2x/7-y=13-y","5x-2y-6x=y/3+4"],
		buttonsDisabled: [false, false, false, false]
	},
	{
		levelnumber: 7,
		text: "NEW CONCEPT - Rule 7: Add or subtract an x term to move it to the other side of the equation",
		equations: ["x-1=19+2x", "4x=x-2", "5x+c=x-9-c","x-5/3=2/3-x","5+x-y=13-y-3x","5x/3-2y=3x-y/3+4","2x/6=5+x/5-2c"],
		buttonsDisabled: [false, false, false, false]
	},
	{
		levelnumber: 8,
		text: "NEW CONCEPT - Rule 8: Double-click on brackets to expand them",
		equations: ["2(x-1)=19", "4=5(x-2)", "5+c=3(x-9-c)","3(x-5/3)/2=2/3","(5+x-y)/4=2(13-y)","5(x-2y-4x)=3(4-2x)","2(3-x)=4(5+x)-2(x+c)","2(x-1)/3-(1-2x)=3(4x-1)"],
		buttonsDisabled: [false, false, false, false]
	}
];

function restartLevel() {
	if (currentLevel != null) {
		init(levels[currentLevel].equations[currentSubLevel]);
	} else {
		newEquation();
	}
}

function cCheck(){
	if (checkSide(leftTiles, rightTiles) || checkSide(rightTiles, leftTiles)) {
		completeMenu.setAttribute("class", "card position-absolute top-0 start-50 translate-middle-x text-bg-light border border-info d-inline mt-3");
		//save to cookie
		if (currentLevel != null) {
			let date = new Date();
			date.setTime(date.getTime() + 365 * 60 * 60 * 1000);
			document.cookie = currentLevel + "." + currentSubLevel + "=1;expires=" + date.toUTCString();
			updateProgressBar();
		} else {
			document.getElementById("progressDiv").setAttribute("class","d-none");
		}
	}
}

function checkSide(sideTiles, otherSide) {
	if (sideTiles.length == 1 && sideTiles[0].letter == 1 && sideTiles[0].coefficient == 1 && sideTiles[0].denominator == 1) {
		//check that no x's or brackets on other side
		//check other terms are simplified
		let numCount = 0;
		let yCount = 0;
		let cCount = 0;
		for (let i = 0; i < otherSide.length; i++) {
			if (otherSide[i].coefficient == 0) {
				if (otherSide.length == 1) {
					hint = "You did it!";
					return true;
				}
				hint = "Click on any tiles with a 0 to remove them";
				return false
			}
			switch (otherSide[i].letter) {
				case 0:
					numCount++;
					break;
				case 1:
					hint = "There are still x's on both sides of the equation. Add or subtract them to move them to the other side.";
					return false;
				case 2:
					yCount++;
					break;
				case 3:
					cCount++;
					break;
				case null:
					hint = "Remove all purple 'multiplier' tiles by dragging them on to their connected tile.";
					return false;
				case 5:
					hint = "Expand all brackets.";
					return false;
				default:
					break;

			}
		}
		if (numCount > 1 || yCount > 1 || cCount > 1) {
			hint = "Collect any like terms.";
			return false;
		} else {
			hint = "You did it!";
			return true;
		}
	}
	hint = "Remove other terms that are on the same side as the x";
	return false;
}

function nextLevel() {
	if (currentLevel == null) {
		closePopup(completeMenu);
	} else if(currentSubLevel>= levels[currentLevel].equations.length-1){
		currentLevel ++;
		currentSubLevel = 0;
	} else {
		currentSubLevel ++;
	}
	setupLevel(currentLevel, currentSubLevel);
}

function updateProgressBar() {
	const cDecoded = decodeURIComponent(document.cookie);
	let doneCount =0;
	let totalCount = 0;
	for(let i=0;i<levels.length;i++){
		for(let j=0;j<levels[i].equations.length;j++){
			totalCount++;
			if(cDecoded.includes(i+"."+j+"=")){
				doneCount++;
			}
		}
	}
	let percent = Math.round(doneCount*100/totalCount);
	let progressBar = document.getElementById("progressBar");
	progressBar.setAttribute("style","width:"+percent+"%");
	progressBar.setAttribute("aria-valuenow",percent);
	progressBar.innerHTML = percent+"%";
	document.getElementById("progressDiv").setAttribute("class","m-3");
}

init();