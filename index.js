const express = require('express');
const cors = require('cors');
const { getIpv4 } = require('./utils/util');
const app = express();

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { Game } = require('./classes/game');
const io = new Server(server);

const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const ipv4 = getIpv4();

const games = {};
let players = [];
let sockets = {};

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/pages/index.html");
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + "/pages/login.html");
})

io.on('connection', (socket) => {

    socket.on('checkUser', data => {
        
        if(!players.includes(data)) {
            
            players.push(data);

            socket.emit('userChecked', {
                exists: false,
                username: data
            })
        } else {
            socket.emit('userChecked', {
                exists: true,
                username: data
            })
        }
    });

    socket.on('disconnect', () => {
        const socketData = sockets[socket.id];

        if(socketData) {
            const room = socketData['room'];

            delete games[room];
            
            players = players.filter(f => f !== socketData['general']);
    
            io.emit('ROOM_DELETED', socketData['room'])
        }
        
    });

    socket.on('checkLogin', data => {

        const loggedIn = players.includes(data);

        if(loggedIn) {
            sockets[socket.id] = {
                general: data
            };
        }

        socket.emit('loginChecked', loggedIn);
    })

    socket.on('logout', data => {
        const room = data['room'];

        delete games[room];
        
        players = players.filter(f => f !== data['general']);

        io.emit('ROOM_DELETED', data['room'])
    })

    socket.on('CREATE_ROOM', data => {
        console.log("CREATE ROOM", data)
        if(data in games) {
            socket.emit('ROOM_EXISTS');
        } else {
            games[data] = new Game(socket, data);
            socket.emit('ROOM_CREATED', {
                room: data,
                map: games[data].map,
                gameStarted: games[data].gameStarted
            });
        }
    });

    socket.on('JOIN_ROOM', data => {
        const room = data['room'];
        const general = data['general'];

        const gameExists = room in games;

        if(gameExists) {
            games[room].join(general, socket, io);
            sockets[socket.id]['room'] = data['room'];
            io.emit('BATTLE_START', {room});
        } else {
            socket.emit('JOIN_FAILED', {notFound: true})
        }
    });

    socket.on('GET_MAP', data => {
        if(data['room'] in games) {
            socket.emit('MAP_UPDATED', {map: games[data['room']].map, gameStarted: games[data['room']].gameStarted, room: data['room'], isPlayer1Turn: games[data['room']].isPlayer1Turn})
        } else {
            io.emit('ROOM_DELETED', data['room'])
        }
    })

    socket.on('PIECE_CLICKED', data => {
        const room = data['room'];
        const general = data['general'];
        const piece = data['piece'];

        games[room].pieceClicked(socket, io, general, piece);
        
    });

    socket.on('PIECE_MOVE', data => {
        games[data['room']].movePiece(io, data);
        if(games[data['room']].gameOver) {
            delete games[data['room']];
        }
    });

    socket.on("START_GAME", data => {
        games[data['room']].gameStarted = true;
        io.emit("GAME_STARTED", {room: data['room'], gameStarted: true})
    })
});


server.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`)
    console.log(`Server started at http://${ipv4}:${PORT}`)
});