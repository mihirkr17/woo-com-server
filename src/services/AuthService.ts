// /src/services/AuthService.ts

const User = require("../model/CUSTOMER_TBL");
const { generateJwtToken } = require("../utils/generator");

class AuthService {
  async login(email: string, password: string) {
    try {
      const user = await User.findOne({ email });

      if (!user) throw new Error(`User with ${email} not found !`);

      const comparePwd = await user.comparePassword(password);

      if (!comparePwd) throw new Error("Password didn't match !");

      // generate a access token
      const token = generateJwtToken(user);

      return token;
    } catch (error) {
      throw error;
    }
  }
}
