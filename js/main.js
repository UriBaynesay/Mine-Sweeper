"use strict";

const GAME_LEVELS = [
  { size: 4, mines: 2 },
  { size: 8, mines: 12 },
  { size: 12, mines: 30 },
];

const GAME_STATUS = [
  { status: `normal`, icon: `😀` },
  { status: `won`, icon: `😎` },
  { status: `lost`, icon: `🤯` },
];

//model

var gBoard;
var gGame;
var gTimerInter;
var gStartTime;
var isFirstClick;
var currGameLevelIdx;
var numLives;
// var numHints;
// var isHintClicked;

function init(sizeIdx = 0) {
  //setting the model
  gGame = createGame();
  console.log("gGame :", gGame);
  gBoard = createBoard(sizeIdx);
  currGameLevelIdx = sizeIdx;
  isFirstClick = true;
  console.log();
  ("gBoard :");
  console.table(gBoard);
  numLives = 3;
  // numHints = 3;
  // isHintClicked = false;

  //setting the DOM
  renderBoard(gBoard, ".table-body");
  renderLives();
  renderSmiley();
  // renderHint();
  var elTimer = document.querySelector(`.timer`);
  elTimer.style.display = `none`;
  clearInterval(gTimerInter);
  gTimerInter = null;
}

function createGame() {
  return { isOn: true, countShown: 0, countMarked: 0, timer: 0 };
}

function createBoard(sizeIdx) {
  var board = createMat(GAME_LEVELS[sizeIdx].size, GAME_LEVELS[sizeIdx].size);
  // setMines(board, sizeIdx);
  // setCellNegsCount(board);

  return board;
}

function createCell() {
  return {
    minesAroundCount: 0,
    //test everyone is shown
    isShown: false,
    isMine: false,
    isMarked: false,
  };
}

function setMines(board, sizeIdx) {
  var randomCount = 0;
  while (randomCount < GAME_LEVELS[sizeIdx].mines) {
    var randCell = getRandomCell(board);
    if (
      board[randCell.i][randCell.j].isMine ||
      board[randCell.i][randCell.j].isShown
    ) {
      continue;
    }
    board[randCell.i][randCell.j].isMine = true;
    randomCount++;
  }
}

function setCellNegsCount(board) {
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      board[i][j].minesAroundCount = getNumMinesAround(board, i, j);
    }
  }
}

function getNumMinesAround(board, k, u) {
  var minesAroundCount = 0;
  for (var i = k - 1; i <= k + 1; i++) {
    if (i < 0 || i >= board.length) continue;
    for (var j = u - 1; j <= u + 1; j++) {
      if (i === k && j === u) continue;
      if (j < 0 || j >= board[i].length) continue;

      if (board[i][j].isMine) minesAroundCount++;
    }
  }
  return minesAroundCount;
}

function cellClicked(elCell) {
  // debugger
  if (!gGame.isOn) return;

  if (!gTimerInter) {
    gStartTime = Date.now();
    gTimerInter = setInterval(function () {
      renderTimer(".timer");
    }, 10);
  }
  var i = +elCell.dataset.i;
  var j = +elCell.dataset.j;

  var cell = gBoard[i][j];

  // if(isHintClicked){
  //   showCellsAround();
  // }

  if (cell.isShown) {
    return;
  }
  
  //update model
  if (isFirstClick) {
    cell.isShown = true;
    isFirstClick = false;
    setMines(gBoard, currGameLevelIdx);
    setCellNegsCount(gBoard);

    // update DOM
    renderMines();
  }

  if (cell.isMarked) {
    gGame.countMarked--;
    cell.isMarked = false;
  }
  cell.isShown = true;
  gGame.countShown++;

  // update DOM
  elCell.classList.add(`shown`);
  renderCell(elCell);

  if (cell.isMine) {
    if (numLives === 0) {
      renderSmiley(`lost`);
      // update model
      gGame.isOn = false;
      clearInterval(gTimerInter);
      gTimerInter = null;

      // update DOM
      showAllMines();
      return;
    }
    numLives--;
    renderLives();
  }

  if (checkGameOver()) {
    gGame.isOn = false;
    clearInterval(gTimerInter);
    gTimerInter = null;
    renderSmiley(`won`);
  }

  if (cell.minesAroundCount) {
    console.log(`only show this cell`);
    return;
  }

  expand(elCell);
}

function expand(elCell) {
  var cellI = +elCell.dataset.i;
  var cellJ = +elCell.dataset.j;
  // update model
  for (var i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= gBoard.length) continue;
    for (var j = cellJ - 1; j <= cellJ + 1; j++) {
      if (i === cellI && j === cellJ) continue;
      if (j < 0 || j >= gBoard[i].length) continue;
      if (gBoard[i][j].isMarked) continue;

      var currCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`);
      if (!gBoard[i][j].isShown) {
        if (gBoard[i][j].minesAroundCount === 0) {
          cellClicked(currCell);
        } else {
          gBoard[i][j].isShown = true;
          gGame.countShown++;
          currCell.classList.add(`shown`);
          renderCell(currCell);
        }
      }
    }
  }
}

function contextMenuHandler(event, elCell) {
  event.preventDefault();
  cellRightClicked(elCell);
}

function cellRightClicked(elCell) {
  if (!gGame.isOn) return;
  if (!gTimerInter) {
    gStartTime = Date.now();
    gTimerInter = setInterval(function () {
      renderTimer(".timer");
    }, 10);
  }

  var cellI = +elCell.dataset.i;
  var cellJ = +elCell.dataset.j;

  if (elCell.classList.contains(`shown`)) {
    if (elCell.classList.contains(`mine`)) {
      gGame.countShown--;
      gBoard[cellI][cellJ].isShown = false;
    } else {
      return;
    }
  }
  //   update the model

  if (gBoard[cellI][cellJ].isMarked) {
    gBoard[cellI][cellJ].isMarked = false;
    gGame.countMarked--;
  } else {
    gBoard[cellI][cellJ].isMarked = true;
    gGame.countMarked++;
  }

  // update the DOM
  renderCell(elCell);

  if (checkGameOver()) {
    gGame.isOn = false;
    clearInterval(gTimerInter);
    gTimerInter = null;
    renderSmiley(`won`);
  }
}

function checkGameOver() {
  // debugger
  if (gGame.countMarked + gGame.countShown < Math.pow(gBoard.length, 2)) {
    console.log("board is not full yet");
    return false;
  }
  var numMinesMarked = getMinesMarked();
  if (gGame.countMarked !== numMinesMarked) return;
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      if (gBoard[i][j].isMine && !gBoard[i][j].isMarked) {
        return;
      }
    }
  }

  console.log("you won!");
  return true;
}

function getMinesMarked() {
  var result = 0;
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      if (gBoard[i][j].isMine && gBoard[i][j].isMarked) {
        result++;
      }
    }
  }
  return result;
}

function setGameLevel(level) {
  init(level);
}

function renderSmiley(status) {
  var elEndGameMsg = document.querySelector(`.smiley`);
  switch (status) {
    case `won`:
      elEndGameMsg.innerText = GAME_STATUS[1].icon;
      break;
    case `lost`:
      elEndGameMsg.innerText = GAME_STATUS[2].icon;
      break;
    default:
      elEndGameMsg.innerText = GAME_STATUS[0].icon;
  }
}

function renderMines() {
  var elCells = document.querySelectorAll(`.cell`);
  for (var i = 0; i < elCells.length; i++) {
    var cellI = +elCells[i].dataset.i;
    var cellJ = +elCells[i].dataset.j;
    if (gBoard[cellI][cellJ].isMine) {
      elCells[i].classList.add(`mine`);
    }
  }
}

function showAllMines() {
  // debugger
  var elMines = document.querySelectorAll(`.mine`);
  console.log(`mines :`, elMines);

  for (var i = 0; i < elMines.length; i++) {
    // update model
    var cellI = elMines[i].dataset.i;
    var cellJ = elMines[i].dataset.j;
    gBoard[cellI][cellJ].isShown = true;

    // update DOM
    elMines[i].classList.add(`shown`);
    renderCell(elMines[i]);
  }
}

function renderLives() {
  var elHeart = document.querySelector(`.heart`);
  if (numLives === 0) {
    elHeart.innerHTML = `No more lives left watch out!`;
    return;
  }
  var strHTML = "";
  for (var i = 0; i < numLives; i++) {
    strHTML += `<img src=./img/heart.png></img>`;
  }
  elHeart.innerHTML = strHTML;
}

function smileyClicked() {
  init(currGameLevelIdx);
}

// function renderHint() {}

// function hintClicked() {
//   if (!gGame.isOn) return;
//   if (numHints) return;
//   if (isFirstClick) return;
//   isHintClicked = true;
// }
