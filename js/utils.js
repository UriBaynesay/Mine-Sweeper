function createMat(ROWS, COLS) {
  var mat = [];
  for (var i = 0; i < ROWS; i++) {
    var row = [];
    for (var j = 0; j < COLS; j++) {
      row.push(createCell());
    }
    mat.push(row);
  }
  return mat;
}

//function return a random cell in a given matrix in the object{i:j}
function getRandomCell(board) {
  var rndCell;
  while (!rndCell) {
    rndCell = randomizeCell(board);
  }
  return rndCell;
}
function randomizeCell(board) {
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      if (Math.random() < 0.02) {
        return { i, j };
      }
    }
  }
}

function renderBoard(board, selector) {
  var strHTML = "";
  for (var i = 0; i < board.length; i++) {
    strHTML += "<tr>";
    for (var j = 0; j < board[0].length; j++) {
      // debugger
      var cellClass='class="cell'
      // if (board[i][j].isMine) {
      //   cellClass += ` mine`;
      // }
      cellClass+=`"`
      var attributes = `${cellClass} data-i="${i}" data-j="${j}"`;
      strHTML += `<td ${attributes} onclick="cellClicked(this)" oncontextmenu="contextMenuHandler(event,this)"></td>`;
    }
    strHTML += "</tr>";
  }

  var elContainer = document.querySelector(selector);
  elContainer.innerHTML = strHTML;
}

function renderCell(elCell) {
  var i = +elCell.dataset.i;
  var j = +elCell.dataset.j;
  var cellContent = "";
  if (gBoard[i][j].isShown) {
    cellContent = gBoard[i][j].isMine
      ? `<img src="img/1.png"></img>`
      : gBoard[i][j].minesAroundCount;
  } else if (gBoard[i][j].isMarked) {
    cellContent = `<img src="img/flag.png"></img>`;
  }
  elCell.innerHTML = cellContent;
}

function renderTimer(selector) {
    var elTimer=document.querySelector(selector);
    elTimer.style.display=`block`;
    elTimer.innerText=((Date.now()-gStartTime)/1000).toFixed(2);
}
