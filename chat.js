const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(express.static('public')); // 여기 폴더 안에 있는 파일들만 외부로 공개. 

/* 
app.get('/', (request, response)=>{
    response.send('<h1>Hello World</h1>');
});
이렇게 response.send(html코드)하면
굉장히 복잡해지므로, senddfile을 하겠음
*/

app.get('/',(request, response)=>{
    response.sendFile(__dirname + '/index.html');
});

// 서버 쪽에서 ~.on 은 'event' 발생시에 작업. emit 'event' 건내주는 것.

io.on('connection',(socket)=>{
    console.log("a user connected"); // 서버 쪽 터미널에 찍어줌
    socket.on('disconnect',()=>{
        console.log('user disconnected'); // io가 socket보다 큰 범위 인듯.
    });
    socket.on('chat message',(msg)=>{
        console.log(`message : ${msg}`);
        io.emit('chat message',msg); // 다시 client 쪽으로 쏴주기
    });

});

// Broadcasting 알려주는 것.

server.listen(3000,()=>{
    console.log("listening on * :3000");
})