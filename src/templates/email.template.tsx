

module.exports.verify_email_html_template = (verifyToken: string, uuid: string) => {
   return (`<table cellspacing="0" cellpadding="0" style="margin: 0 auto;">
   <tr>
      <td><h5>Verify your email address. please click the link below </h5></td>
   </tr>
   <tr>
      <td align="center" bgcolor="#FFFFFF" style="padding: 1.3rem 1.4rem; border-radius: 4px;">
         <a href="${process.env.BACKEND_URL}api/v1/auth/verify-register-user?token=${verifyToken}&mailer=${uuid}" 
         target="_blank" 
            style="font-weight: bold; 
            font-family: Arial, sans-serif; 
            color: #FFFFFF; 
            text-decoration: none; 
            display: block;
            letter-spacing: 1px;
            font-size: 1rem;
            appearance: button;
            background-color: hotpink;
            border: 1px solid hotpink;
            border-radius: 4px;
            padding: 0.3rem 0.8rem;
            "
         >
            Click Here To Verify Email
         </a>
      </td>
   </tr>
</table>`)
}