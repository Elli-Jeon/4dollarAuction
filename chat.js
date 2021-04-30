const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const jwt = require("jsonwebtoken");
const auth = require('./lib/auth.js');
let mysql = require('mysql');
const request = require("request");
const { count } = require('console');


let connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '6867',
    database : 'mydb'
})

connection.connect();

app.use(express.static('public')); // 여기 폴더 안에 있는 파일들만 외부로 공개. 웬만하면 하나만.
// 왜 css파일들이 /assets으로 되어있는데 되나? 그것은. root위에 public폴더를 올린 것이 아니라, root위에 public한 폴더들을 바로 연결해주었기 때문.

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* 
app.get('/', (request, response)=>{
    response.send('<h1>Hello World</h1>');
});
이렇게 response.send(html코드)하면
굉장히 복잡해지므로, senddfile을 하겠음
*/

app.get('/',(request, response)=>{
    response.sendFile(__dirname + '/login.html')
})

app.get('/chatroom',(request, response)=>{
    response.sendFile(__dirname + '/chatroom.html');
});

app.get('/signup',(request, response)=>{
    response.sendFile(__dirname + '/signup.html')
})

app.post('/signup',(request, response)=>{
    console.log(request.body); // parse 필요없나?
    let userName = request.body.userName;
    let userEmail = request.body.userEmail;
    let userPassword = request.body.userPassword;

    let sql = "INSERT INTO user (user_email,user_name,user_password,user_account,access_token,user_seqno) VALUES(?,?,?,?,?,?)";
    connection.query(
        sql,
        [
            userEmail,
            userName,
            userPassword,
            0,
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",  //원래는 api로 인증을 받아와서. 
            1100772147 // 이것도 그럼. 지금은 시간없으니 다 받아왔다는 가정 아래에서.
        ],
        function(error, results, fields){
            if (error) throw error;
            else {
                console.log("sql :", this.sql);
                response.json(1); // return 1줘서 아까 signup 페이지 1이 나온듯?
            }
        }
    )
});

app.get('/login',(request, response)=>{
    response.sendFile(__dirname + '/login.html');
});

app.post('/login', function(req, res){
    console.log("사용자 입력정보 : ", req.body);  
    let userEmail = req.body.userEmail;
    let userPassword = req.body.userPassword;
    //db 가서 페스워드 맞는지 체크
    let sql = "SELECT * FROM user WHERE user_email = ?";
    connection.query(sql, [userEmail], function(error, results, fields){  // 두번째 파라미터는 배열만 가능. 명세 확인
        if (error) throw error;
        else {
            if (results.length === 0){
                res.json("등록되지 않은 아이디입니다.");  // 이건 왜 res.json??
            } else {
                let dbPassword = results[0].user_password;
                if (userPassword == dbPassword){
                    let tokenkey = "fintech";
                    jwt.sign(  // 이정보가 토큰화되어서.
                        {
                            userName : results[0].user_name,
                            userEmail: results[0].user_email
                        }, tokenkey,
                        {
                            expiresIn : "10d",
                            issuer : "fintech.admin",
                            subject : "user.login.info",
                        }, 
                        function(err,token) {
                            console.log("로그인 성공(유저 정보 담은)", token);
                            res.json(token); //로그인에 성공하면 client 쪽으로 jwt토큰 전송
                            return token;
                        }  //잠만. 이 토큰을 아래 단계에서 사용하도록 어케 return하지?? 여기서 return을 주나? 아니면 client 쪽에서 socket.on 의 파라미터로 전달?? ㄴㄴ socket.emit()
                    );
                } else {
                    res.json("비밀번호가 다릅니다.");
                }

            }
        }
    })
})

app.post('/chatroom',auth,(req, res)=>{  //chatroom에서 post 위해서는  post하며 auth라는 미들웨어를 거치겠다는 것. 근데 잘 못 가지고 온 코드임. 원 코드는 계좌 리스트 보여주는 코드였음.
    let userEmail = req.decoded.userEmail;
    let sql = "SELECT * FROM user WHERE user_email = ?";
    connection.query(sql, [userEmail], (err, results)=>{
        if(err){
            console.log(err);
            throw err;
        } else {
            console.log("조회한 개인 값 : ", results);
            let option = {
                method: "GET",
                url: "https://testapi.openbanking.or.kr/v2.0/user/me",
                headers: {
                  Authorization: "Bearer " + results[0].accesstoken,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                //form 형태는 form / 쿼리스트링 형태는 qs / json 형태는 json ***
                qs: {
                  user_seq_no: results[0].userseqno,
                  //#자기 키로 시크릿 변경
                },
            };
            request(option, (error, res, body)=>{  
                let listResult = JSON.parse(body);
                console.log("result :"+ listResult);
                response.json(listResult);
            });
        }
    });
});

app.get("/withdraw", (request, response)=>{ //get은 단순히 페이지에 들어가면 작동 
    response.sendFile(__dirname + "/withdraw.html");
})

app.post("/withdraw", auth, (req, res)=>{ // post는 어떤 상호작용을 넣어주고서. withdrawhtml의 ajax요청같은
    //console.log(req.decoded);  //auth라는 미들웨어를 거치기 때문에 decoded된 토큰이 건너옴.
    let unserEmail = req.decoded.userEmail;
    let productId = req.body.product_id;
    let fin_use_num = req.body.fin_use_num;
    //console.logreq.body);

    let countnum = Math.floor(Math.random() * 1000000000) + 1; // 은행 거래 번호 주기 위한.
    let transId = "M202112107U" + countnum;

    let sql = "SELECT highest_price FROM product WHERE product_id = ?";
    connection.query(sql, [productId], (err, results)=>{
        if(err){ throw err; }
        else {
            console.log("이 제품의 최고가: " + results[0].highest_price);
            let option = {
                method: "POST",
                url: "https://testapi.openbanking.or.kr/v2.0/transfer/withdraw/fin_num",
                headers: {
                  Authorization: "Bearer " + "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiIxMTAwNzcyMTQ3Iiwic2NvcGUiOlsiaW5xdWlyeSIsImxvZ2luIiwidHJhbnNmZXIiXSwiaXNzIjoiaHR0cHM6Ly93d3cub3BlbmJhbmtpbmcub3Iua3IiLCJleHAiOjE2MjcxOTQ5ODksImp0aSI6ImNmY2NlYjk0LTliZDAtNDZmZi1iZDI0LThmZmIzMjNhZDExOSJ9.xEk-xaX2q0AHUNk1rwP7OBsSs4C3_m3aCSorNobLz4A",
                  "Content-Type": "application/json",
                },
                json : {
                    bank_tran_id: transId,
                    cntr_account_type: "N",
                    cntr_account_num: "100000000001",
                    dps_print_content: "낙찰",
                    fintech_use_num: fin_use_num,
                    wd_print_content: "오픈뱅킹출금",
                    tran_amt: "1000",
                    tran_dtime: "20210429101010",
                    req_client_name: "전상우",
                    req_client_fintech_use_num: fin_use_num,
                    transfer_purpose: "ST",
                    req_client_num: "110435475398",
                    recv_client_name: "전상우",
                    recv_client_bank_code: "097",
                    recv_client_account_num: "100000000001",
                },
            };

            request(option, (error, response, body)=>{
                console.log(body);
                if(body.rsp_code == "A0000"){
                    res.json(1);  //app.post의 res
                }
            })
            // 입금이체는 다른 토큰을 사용해야ㅕ.
            /*
            request(option, (error, response, body)=>{  // 위의 request랑 겹쳤어가지고 req로 바꿔줌.
                console.log(body);
                let countnum2 = Math.floor(Math.random() * 1000000000) + 1;
                let transId2 = "M202112107U" + countnum2;
                if(body.rsp_code == "A0000"){
                    let option = {
                        method: "POST",
                        url:
                        "https://testapi.openbanking.or.kr/v2.0/transfer/deposit/fin_num",
                        headers: {
                        Authorization:
                            "Bearer " +
                            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiIxMTAwNzcyMTQ3Iiwic2NvcGUiOlsiaW5xdWlyeSIsImxvZ2luIiwidHJhbnNmZXIiXSwiaXNzIjoiaHR0cHM6Ly93d3cub3BlbmJhbmtpbmcub3Iua3IiLCJleHAiOjE2MjcxOTQ5ODksImp0aSI6ImNmY2NlYjk0LTliZDAtNDZmZi1iZDI0LThmZmIzMjNhZDExOSJ9.xEk-xaX2q0AHUNk1rwP7OBsSs4C3_m3aCSorNobLz4A",
                             "Content-Type": "application/json",
                        }, 
                        json : {
                            cntr_account_type: "N",
                            cntr_account_num: "100000000001",
                            wd_pass_phrase: "NONE",
                            wd_print_content: "낙찰",
                            name_check_option: "on",
                            tran_dtime: "20210430111010",
                            req_cnt: "1",
                            req_list: [
                                {
                                tran_no: "1",
                                bank_tran_id: transId2,
                                fintech_use_num: fin_use_num,
                                print_content: "제품구매",
                                tran_amt: "1000",
                                req_client_name: "전상우",
                                req_client_fintech_use_num: "120211210788932288467081",
                                req_client_num: "110435475398",
                                transfer_purpose: "ST",
                                },
                            ],
                        },
                    };
                    request(option, (error, response, body)=>{
                        console.log(body);
                        if(body.rsp_code == "0"){
                            res.json(response);
                        }
                    });
                }

            }) */
        }
    })
})



var userList = []; //여기에 userEmial, socketID를 보관할 것.
let highPrice = 0;

// 서버 쪽에서 ~.on 은 'event' 발생시에 작업. emit 'event' 건내주는 것.

io.on('connection',(socket)=>{
    console.log("a user connected"); // 서버 쪽 터미널에 찍어줌
    socket.on('disconnect',()=>{
        console.log('user disconnected'); 
        // io가 socket보다 큰 범위 인듯. InputOutput은 모든 연결, socket은 개별 연결!!!
        console.log(socket.id);
    });

    socket.on('chat message',(msg)=>{
        msg = parseInt(msg);
        console.log(`message : ${msg}`);
        io.emit('chat message',msg);
                
        if(msg > highPrice){
            highPrice = msg;
            console.log(`highprice : ${highPrice}`)
            io.emit('highest price',msg);
        }

        // 다시 client 쪽으로 쏴주기  Broadcasting 알려주는 것.
    });

    
    socket.on('store highest price',(data)=>{
        console.log(data);
        let token = data.token;
        let tokenkey = "fintech";
        jwt.verify(token, tokenkey, (err, decoded)=>{  // 비동기라서 verify가 시간이 오래걸려서 sql 문 안으로 삽입
            console.log("현재 클라에서도 저장된 토큰을 풀어놓은 것."+JSON.stringify(decoded));
            let sql = "UPDATE product SET highest_price = ?, suggest_email = ? WHERE product_id = ?"
            connection.query(sql, [data.highestprice, decoded.userEmail ,12345678],(error, results, fields)=>{
                if(err) throw err;
                else {
                    console.log("price update success"); // db 저장
                }
            })    
        });
    });
    
    //setTimeout(); // 원래 시간이 되면 종료이지만, 여기서는 시현을 위해 몇 초후에 종료로 할 것.

    // 시간이 다 되면, 가장 highest한 가격 제시한 애한테만 alert. 나머지한테는 종료되었습니다.



    socket.on('login',(data)=>{  //userlist 만들어주려했는데, 일단 결제부터.
        let token = data.token;
        let tokenkey = "fintech";
        jwt.verify(token, tokenkey, (err, decoded)=>{  
            //console.log("decoded:"+JSON.stringify(decoded));
            console.log(decoded.userEmail, socket.id);

            userList.push({
                userEmail : decoded.userEmail,
                socketId : socket.id
            });

            console.log("userlist: "+ JSON.stringify(userList));
        });
    });


    socket.on('getUser', () => {
        socket.emit('userListUpdate', userList)
    });
});


server.listen(3001,()=>{
    console.log("listening on * :3001");
})

// SQL 파트. mysql table은 원래 소문자랑 _ 로 써야함. 
/*    
//let sql = 'SELECT * FROM product';
let sql = "INSERT user(SocketID, UserID, UserPassword, ProductID, UserAccount)VALUES('12345678901234567890','test','1234','','AMBO12341234')";

connection.query(sql,(error, results, fields)=>{  //results는 행의 정보 담은 배열, fields는 컬럼
    if (error){
        console.log(error);
    }
    console.log(results);
})

connection.end();

*/

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