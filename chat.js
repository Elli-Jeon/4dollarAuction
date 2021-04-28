const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(express.static('public')); // 여기 폴더 안에 있는 파일들만 외부로 공개. 웬만하면 하나만.
// 왜 css파일들이 /assets으로 되어있는데 되나? 그것은. root위에 public폴더를 올린 것이 아니라, root위에 public한 폴더들을 바로 연결해주었기 때문.

/* 
app.get('/', (request, response)=>{
    response.send('<h1>Hello World</h1>');
});
이렇게 response.send(html코드)하면
굉장히 복잡해지므로, senddfile을 하겠음
*/

app.get('/',(request, response)=>{
    response.sendFile(__dirname + '/chatroom.html');
});
var userList = [];

// 서버 쪽에서 ~.on 은 'event' 발생시에 작업. emit 'event' 건내주는 것.

io.on('connection',(socket)=>{
    console.log("a user connected"); // 서버 쪽 터미널에 찍어줌
    socket.on('disconnect',()=>{
        console.log('user disconnected'); 
        // io가 socket보다 큰 범위 인듯. InputOutput은 모든 연결, socket은 개별 연결!!!
        console.log(socket.id);
    });
    socket.on('chat message',(msg)=>{
        console.log(`message : ${msg}`);
        io.emit('chat message',msg); // 다시 client 쪽으로 쏴주기  Broadcasting 알려주는 것.
    });
    socket.on('login',(msg)=>{
        console.log(`login : ${msg}`);
        userList.map((user) => {
            if(user.userId == msg){
                return;
            }
            else {
                userList.push({
                    userId : msg,
                    socketId : socket.id
                })                        
            }
        })
    });
    socket.on('getUser', () => {
        socket.emit('userListUpdate', userList)
    })
});


server.listen(3000,()=>{
    console.log("listening on * :3000");
})




/* 
화요일. 오늘 구현해야 할 서비스.
상품 정보 구역. 타이머. 메시지 옆에 타이머. 메시지 옆에 프로필? "익명 누구누구". 
메시지 창에 가격만(v). 마지막 메시지가 최종 가격. 타이머 지나면 창 뜨면서 종료 메시지.
최고가 갱신되면 최고가 써지는 구역에 ???
*/

/*
수요일.
클라에서 메시지 제출누르면 socket.emit안에다가 바로 클라로 연결해주기. 그리고 바로 dbconnect해주어서 insert 시키고
타이머 종료되면 마지막 값을 띄어주기.
결제 시스템까지.
*/ 