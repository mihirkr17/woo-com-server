const nodemailer = require("nodemailer");

module.exports = async function email_service(option: any) {
   try {
      const { to, subject, html } = option;

      if (!to) {
         return;
      }

      const transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: {
            type: 'OAuth2',
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PWD,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN
         }
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