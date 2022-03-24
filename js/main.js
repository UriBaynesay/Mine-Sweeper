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

const SAFE_CLICK = `🦺`;

const HINT_ICON = `💡`;
//model

var gBoard;
var gGame;
var gTimerInter;
var gStartTime;
var isFirstClick;
var currGameLevelIdx;
var numLives;
var numSafeClicks;
var numHints;
var isHintClicked;
// var isManualGame;

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
  numSafeClicks = 3;
  numHints = 3;
  isHintClicked = false;
  // isManualGame=manual;

  //setting the DOM
  // var elManualBtn = document.querySelector(`.manual button`);
  // elManualBtn.style = `initial`;
  renderLives();
  renderSafeClicks();
  renderHint();
  renderBoard(gBoard, ".table-body");
  renderSmiley();
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
  // setRandomMines(board, sizeIdx);
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

function setRandomMines(board, sizeIdx) {
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

  // if(isManualGame)

  if (!gTimerInter) {
    gGame.isOn = true;
    gStartTime = Date.now();
    gTimerInter = setInterval(function () {
      renderTimer(".timer");
    }, 10);
  }

  if (isHintClicked) {
    checkHint(elCell);
    return;
  }

  var i = +elCell.dataset.i;
  var j = +elCell.dataset.j;

  var cell = gBoard[i][j];

  if (cell.isShown) {
    return;
  }

  //update model
  if (isFirstClick) {
    cell.isShown = true;
    isFirstClick = false;
    setRandomMines(gBoard, currGameLevelIdx);
    setCellNegsCount(gBoard);

    // update DOM
    renderMines();
    // var elManualBtn = document.querySelector(`.manual button`);
    // elManualBtn.style.display = `none`;
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
    strHTML += `<img src="img/heart.png"></img>`;
  }
  elHeart.innerHTML = strHTML;
}

function smileyClicked() {
  init(currGameLevelIdx);
}

function renderHint() {
  var elHint = document.querySelector(`.hint`);
  var strHTML = "<p>";
  for (var i = 0; i < numHints; i++) {
    strHTML += `<span class="hint${i}">${HINT_ICON}</span>`;
  }
  strHTML += `</p>`;
  elHint.innerHTML = strHTML;
}

function hintClicked() {
  // debugger
  if (!gGame.isOn) return;
  if (!numHints) return;
  if (isFirstClick) return;
  isHintClicked = true;
  // debugger
  var elHint = document.querySelector(`.hint${numHints - 1}`);
  elHint.classList.add(`selectedHint`);
}

function checkHint(elCell) {
  var cellI = +elCell.dataset.i;
  var cellJ = +elCell.dataset.j;
  if (gBoard[cellI][cellJ].isShown) {
    console.log(`already shown`);
    return;
  }

  showHint(cellI, cellJ);
}

function showHint(cellI, cellJ) {
  // debugger
  var cellsToShow = [];
  for (var i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= gBoard.length) continue;
    for (var j = cellJ - 1; j <= cellJ + 1; j++) {
      if (j < 0 || j >= gBoard[0].length) continue;
      if (gBoard[i][j].isShown) continue;

      // update model
      gBoard[i][j].isShown = true;
      //update DOM
      var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`);
      renderCell(elCell);
      cellsToShow.push({ i, j });
    }
  }
  setTimeout(
    function (cellsToHide) {
      for (var i = 0; i < cellsToHide.length; i++) {
        //update model
        gBoard[cellsToHide[i].i][cellsToHide[i].j].isShown = false;
        //update DOM
        var elCell = document.querySelector(
          `[data-i="${cellsToHide[i].i}"][data-j="${cellsToHide[i].j}"]`
        );
        renderCell(elCell);
      }
    },
    1000,
    cellsToShow
  );

  isHintClicked = false;
  numHints--;
  renderHint();
}

function renderSafeClicks() {
  var elSafeClick = document.querySelector(`.safe-click`);
  var strHTML = "Just for safety : ";
  for (var i = 0; i < numSafeClicks; i++) {
    strHTML += SAFE_CLICK;
  }

  if (numSafeClicks === 0) {
    strHTML = `No safety jackets left!`;
  }
  elSafeClick.innerText = strHTML;
}

function safeClick() {
  // debugger;
  if (!gGame.isOn) return;
  if (!numSafeClicks) return;
  var safeCell;

  while (!safeCell) {
    var rndCell = getRandomCell(gBoard);
    if (
      !gBoard[rndCell.i][rndCell.j].isShown &&
      !gBoard[rndCell.i][rndCell.j].isMine
    ) {
      safeCell = rndCell;
    }
  }

  var elSafeCell = document.querySelector(
    `[data-i="${safeCell.i}"][data-j="${safeCell.j}"]`
  );
  elSafeCell.classList.toggle(`selected-cell`);
  setTimeout(
    function (elCell) {
      elCell.classList.toggle(`selected-cell`);
    },
    1500,
    elSafeCell
  );
  numSafeClicks--;
  renderSafeClicks();
}

// function setManualMines(elButton) {
//   elButton.style.border=`dotted`;
// }
