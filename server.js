const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomusers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = 'issoke';

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
    // console.log('new user is connected');
    socket.on('joinRoom', ({username, room}) => {

        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        socket.emit('message', formatMessage(botName, 'Welcome to the future')); // emit to single client
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} have joined the chat`)); // emit for everyone except the client himself

        // send users and room info
        io.to(user.room).emit('roomUsers', {
            room : user.room,
            users : getRoomusers(user.room)
        });
    });

    socket.on('chatMessage', msg => {
       // console.log(msg);
       const user = getCurrentUser(socket.id);
       io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} have left the chat`));

            // send users and room info
            io.to(user.room).emit('roomUsers', {
                room : user.room,
                users : getRoomusers(user.room)
            });
        }
    });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})