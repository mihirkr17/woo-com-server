var jwt = require("jsonwebtoken");


module.exports = function setToken(userInfo: any) {
  const token = jwt.sign({
    _uuid: userInfo?._uuid,
    email: userInfo?.email,
    role: userInfo?.role,
    status: 'online'
  }, process.env.ACCESS_TOKEN, {
    algorithm: "HS256",
    expiresIn: "16h",
  });

  return token;
}