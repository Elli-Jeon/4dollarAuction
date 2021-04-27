const { Console } = require('console');
var express = require('express');
var app = express();

var http = require('http');
var server = http.Server(app); 

var socket = require('socket.io');
var io = socket(server);

let userList = [];

var port = 3000;

app.get('/', (request, response)=>{
    console.log('root in')
    response.sendFile(__dirname + '/testchat.html');
});

io.on('connection',(socket)=>{  
    //io는 socket.io import한 변수
    // socket은 connection 성공시에 받아오는 커넥션에 관한 정보 담은 변수
    console.log('User Join');
    console.log(socket.id);
    userList.push({
        id : socket.id,
        name : '판매자'
    })
    console.log(userList);

    socket.on('SEND',(msg)=>{
        console.log(msg);
    })
})

server.listen(port, ()=>{
    console.log(port)
    console.log('Server on!')
});
