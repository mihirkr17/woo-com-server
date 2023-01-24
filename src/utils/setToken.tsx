var jwt = require("jsonwebtoken");


module.exports = function setToken(userInfo: any) {

  const payload = {
    _UUID: userInfo?._UUID,
    email: userInfo?.email,
    role: userInfo?.role,
    status: 'online'
  }

  const token = jwt.sign(payload, process.env.ACCESS_TOKEN, {
    algorithm: "HS256",
    expiresIn: "16h",
  });

  return token;
}