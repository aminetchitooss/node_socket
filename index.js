const express = require('express')
const http = require('http')
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config')
const Encryption = new config()
const Game = require('./models/Game')
// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const config = require("./credData.json");
// const fetch = require('node-fetch');
// admin.initializeApp({
//     credential: admin.credential.cert(config),
//     databaseURL: `https://${config.projectId}.firebaseio.com`
// });
// const db = admin.firestore();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const games = new Array(new Game)
games.pop()

app.use(cors({ origin: true }))
var server = http.createServer(app);


//--------------------------------------------------------POST/GET------------------------------------------------------------------

app.get('/', (req, res) => {
    res.end('<h1>Web socket api</h1>')
})
app.get('/game/:id', (req, res) => {

    const vDecryptedId = Encryption.decrypt(req.params.id)
    let gameFound = null
    if (vDecryptedId) {
        gameFound = games.find(res => res.id === vDecryptedId)
        if (gameFound)
            return sendResponse(res, { exist: true, game: gameFound })
    }
    console.log('Game notFound')
    return sendResponse(res, { exist: false })
})
app.get('/gameMessages/:id', (req, res) => {

    const vDecryptedId = Encryption.decrypt(req.params.id)
    let gameFound = new Game()
    if (vDecryptedId) {
        gameFound = games.find(res => res.id === vDecryptedId)
        if (gameFound)
            return sendResponse(res, { msgList: gameFound.messages })
    }
    console.log('Message Game notFound')
    return sendResponse(res, { exist: false })
})

app.post('/createGame', (req, res) => {
    const id = Date.now().toString()
    try {
        console.log('uno')
        const gameTocreate = {
            id,
            state: false,
            actif: true,
            players: [
                {
                    id: req.body.id,
                    name: req.body.name,
                    admin: true
                }
            ],
            name: req.body.gameName,
            messages: []
        }
        console.log('dos')
        games.push(gameTocreate)
        console.log('gamecreated', games)
        const idEncrypted = Encryption.encrypt(id)
        return sendResponse(res, { id: idEncrypted })

    } catch (error) {
        console.log(error.message)
        res.status(500).send(error.message)
    }
})
app.post('/savePlayer', (req, res) => {
    try {
        const playerToAdd = {
            id: req.body.id,
            name: req.body.name,
            admin: false
        }
        const gameFound = games.find(res => res.id === req.body.idRoom)
        if (gameFound) {
            gameFound.players.push(playerToAdd)
        } else {
            console.log('game not found')
        }
        return sendResponse(res, { status: 'OK' })
    } catch (error) {
        console.log(error.message)
        res.status(500).send(error.message)
    }
})

//--------------------------------------------------------WEB_SOCKET----------------------------------------------------------------

var io = require('socket.io').listen(server);
// io.origins('*:*') 
io.set('origins', '*:*');
io.on('connection', (socket) => {

    console.log('new connection made.');

    socket.on('join', function (data) {
        //joinin
        const roomId = data.room
        if (!roomId) {
            console.log('bad join Id')
        } else {
            socket.join(roomId);

            console.log(data.user + ' joined the room : ' + roomId);

            const gameFound = games.find(res => res.id === roomId)
            socket.broadcast.to(roomId).emit('new user joined', { user: data.user, game: gameFound, message: 'has joined this room.' });
        }
    });


    socket.on('leave', function (data) {

        console.log(data.user + 'left the room : ' + data.room);

        socket.broadcast.to(data.room).emit('left room', { user: data.user, message: 'has left this room.' });

        socket.leave(data.room);
    });

    socket.on('message', function (data) {

        const gameFound = games.find(res => res.id === data.room)
        if (gameFound)
            gameFound.messages.push(data.message)
        io.in(data.room).emit('new message', { message: data.message });
    })

    socket.on('startGame', function (data) {
        console.log('Game Started => ', data.room)
        const gameFound = games.find(res => res.id === data.room)
        if (gameFound)
            gameFound.state = true
        socket.broadcast.to(data.room).emit('gameOn', { state: true });
    })
});




server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}

function includeCors(response) {
    response.set('Access-Control-Allow-Origin', "http://localhost:4200");
    response.set('Access-Control-Allow-Headers', "*");
    // response.set('Access-Control-Request-Headers', "*");
    // response.set('Access-Control-Allow-Credentials', 'true');
}

function sendResponse(res, resBody) {
    return res.send(JSON.stringify(resBody))
}