const socket = io();
let symbol;
let myTurn = false;
$(function () {
  // pre game
  $(".board button").attr("disabled", true);
  $(".board> button").on("click", makeMove);
  $("#messages").text("Waiting for player to join...");

  // on start game
  socket.on("game.begin", function (data) {
    symbol = data.symbol;
    myTurn = symbol === "X";
    renderTurnMessage();
  });

  // on game move
  socket.on("move.made", function (data) {
    $("#" + data.position).text(data.symbol);
    myTurn = data.symbol !== symbol;

    $(".board button").attr("disabled", true);
    if (!isGameOver()) {
      if (gameTied()) {
        $("#messages").text("Game Drawn!");
      } else {
        renderTurnMessage();
      }
    } else {
      $("#messages").text(myTurn ? "Game over. You lost." : "Game over. You won!");
    }
  });


  // the opponent is an evil player
  socket.on("opponent.left", function () {
    $("#messages").text("Your opponent left the game.");
    $(".board button").attr("disabled", true);
  });
});

function makeMove(e) {
  e.preventDefault();
  // if this is not my turn wait until
  if (!myTurn) {
    return;
  }

  if ($(this).text().length) {
    return;
  }

  // send the server the movement that i want to do
  socket.emit("make.move", {
    symbol: symbol,
    position: $(this).attr("id"),
  });
}

function getBoardState() {
  const obj = {};
  $(".board button").each(function () {
    obj[$(this).attr("id")] = $(this).text() || "";
  });
  return obj;
}

function gameTied() {
  const state = getBoardState();

  return (
    state.a0 !== "" && state.a1 !== "" && state.a2 !== "" &&
    state.b0 !== "" && state.b1 !== "" && state.b2 !== "" &&
    state.c0 !== "" && state.c1 !== "" && state.c2 !== ""
  )
}

function isGameOver() {
  const state = getBoardState();

  // ways to win
  const rows = [
      // rows
    state.a0 + state.a1 + state.a2,
    state.b0 + state.b1 + state.b2,
    state.c0 + state.c1 + state.c2,

    // cols
    state.a0 + state.b0 + state.c0,
    state.a1 + state.b1 + state.c1,
    state.a2 + state.b2 + state.c2,

      // slant
    state.a0 + state.b1 + state.c2,
    state.a2 + state.b1 + state.c0,
  ];

  return rows.includes("XXX") || rows.includes("OOO");
}

function renderTurnMessage() {
  $("#messages").text(myTurn ? "Your turn.":"Your opponent's turn");
  $(".board button").removeAttr("disabled", !myTurn);
}
