const express = require('express');
const app = express();
app.use(express.static('public'))
const port = 5000
const http = require('http').createServer(app);
const io = require('socket.io')(http);

http.listen(port)  /// http://localhost:5000/

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

let players = {}, unmatched_player_socket;

function joinGame(socket) {
  players[socket.id] = {
    opponent: unmatched_player_socket,
    symbol: "X",
    socket: socket,
  };

  // if there is any waiting player to play with connect the two
  if (unmatched_player_socket !== undefined) {
    players[socket.id].symbol = "O";
    players[unmatched_player_socket].opponent = socket.id;
    unmatched_player_socket = undefined;
  } else {
    // make me wait for the other player
    unmatched_player_socket = socket.id;
  }
}

function getOpponent(socket) {
  const player_data = players[socket.id]
  if (player_data === undefined){
    return;
  }
  const opponent = player_data.opponent;
  if (!opponent) {
    return;
  }
  return players[opponent].socket;
}


io.sockets.on("connection", function (socket) {
  joinGame(socket);
  const opponent = getOpponent(socket);
  // is there any opponent to play with
  if (opponent) {
    // start game for me
    socket.emit("game.begin", {
      symbol: players[socket.id].symbol,
    });
    // start game for the opponent
    opponent.emit("game.begin", {
      symbol: players[opponent.id].symbol,
    });
  }

  socket.on("make.move", function (data) {
    const opponent = getOpponent(socket);
    // don't do anything if there is no opponent
    if (!opponent) {
      return;
    }
    socket.emit("move.made", data);
    opponent.emit("move.made", data);
  });

  socket.on("disconnect", function () {
    const opponent = getOpponent(socket);
    // save space in the server for removing the players from the connected player list
    if (unmatched_player_socket === socket.id)
      unmatched_player_socket = undefined
    delete players[socket.id]
    if (opponent) {
      opponent.emit("opponent.left");
      delete players[opponent.id]
    }
  });
});
