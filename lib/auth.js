const jwt = require('jsonwebtoken');
let tokenkey = "fintech";

const authMiddleware = (request, response, next)=>{
    const token = request.headers["ourtoken"] || request.query.token;
    console.log("사용자가 전송한 토큰 :", token);
    if(!token){
        return response.status(403).json({
            server : "우리 서버",
            success : false,
            message : "not logged in",
        });
    }

    const p = new Promise((resolve, reject)=>{
        jwt.verify(token, tokenkey, (err, decoded)=>{
            if(err) reject(err);
            resolve(decoded);
        });
    });

    const onError = (error)=>{
        console.log(error);
        response.status(403).json({
            server : "우리 서버",
            success : false,
            message : "not logged in",
        });
    };

    p.then((decoded)=>{
        request.decoded = decoded;
        next();
    }).catch(onError);
};

module.exports = authMiddleware;