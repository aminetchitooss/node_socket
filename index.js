const express = require('express')
const http = require('http')
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors');

app.use(cors({ origin: true }))
var server = http.createServer(app);

var io = require('socket.io').listen(server);
// io.origins('*:*') 
io.set('origins', '*:*');
io.on('connection', (socket) => {

    console.log('new connection made.');

    socket.emit('test event', "you're on air prd")

    socket.on('join', function (data) {
        //joining
        socket.join(data.room);

        console.log(data.user + 'joined the room : ' + data.room);

        socket.broadcast.to(data.room).emit('new user joined', { user: data.user, message: 'has joined this room.' });
    });


    socket.on('leave', function (data) {

        console.log(data.user + 'left the room : ' + data.room);

        socket.broadcast.to(data.room).emit('left room', { user: data.user, message: 'has left this room.' });

        socket.leave(data.room);
    });

    socket.on('message', function (data) {

        io.in(data.room).emit('new message', { user: data.user, message: data.message });
    })
});




server.listen(port);
// server.on('error', onError);
// server.on('listening', onListening);


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