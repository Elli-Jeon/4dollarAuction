var today = new Date();
var year = today.getFullYear();
var month = today.getMonth() + 1;
month = month >= 10 ? month : '0' + month;
var day = today.getDate();
day = day >= 10 ? day : '0' + day;
var hour = 19;
var min = today.getMinutes();

var startTime = `${month}.${day} ${hour} : ${min}`;
var endTime = `${month}.${day} ${hour+1} : ${min}`;

var startTimeElement = document.getElementById('starttime');
startTimeElement.textContent = startTime;

var endTimeElement = document.getElementById('endtime');
endTimeElement.textContent = endTime;
// End. timebox

let countDownTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 20, 00).getTime(); //당일 20시
let timer = setInterval(()=>{

    let now = new Date();


    if(now.getHours() === 19){
        let now = now.getTime();
        let timeleft = countDownTime - now;

        let hours = Math.floor((timeleft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));

        let realtimer = `${minutes} Left!!`;

        if(timeleft >= -1000){
            realtimer = "Good Bye"
        }
        
        document.getElementById('realtimer').textContent = realtimer;
    } else {
        document.getElementById('realtimer').textContent = "60:00";
    } 

},1000);


// 원래는 이렇게 클라쪽에서 타이머 조정하면 조작위험. 서버에서 관리해야함. socket.emit 안에 setinterval



// 서버쪽에서 쓰는 js 파일들은 public에 넣지 말고 exports 해주자! 이 파일처럼 client쪽에서 쓰는 애들은 공개 가능이면 public에 넣어주면 404 not found 안 뜸.



