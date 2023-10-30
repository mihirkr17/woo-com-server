const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;


/**
 * 
 * @param option 
 * @returns 
 */
async function smtpSender(option: any) {
   try {
      const { to, subject, html } = option;

      if (!to) {
         return;
      }

      // const OAuth2_client = new OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET);

      // OAuth2_client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

      // const accessToken = OAuth2_client.getAccessToken();

      const transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: {
            user: process.env.GMAIL,
            pass: process.env.GMAIL_PWD
        }
         // auth: {
         //    type: 'OAuth2',
         //    user: process.env.GMAIL_USER,
         //    pass: process.env.GMAIL_PWD,
         //    clientId: process.env.GMAIL_CLIENT_ID,
         //    clientSecret: process.env.GMAIL_CLIENT_SECRET,
         //    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
         //    accessToken
         // }
      });

      const info = await transporter.sendMail({
         from: process.env.GMAIL_USER,
         to,
         subject,
         html
      });

      return info;

   } catch (error: any) {
      return error;
   }
}

module.exports = smtpSender;