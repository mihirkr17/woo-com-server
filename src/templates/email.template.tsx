
module.exports.buyer_order_email_template = (data: any, totalAmount: number) => {

   let ind = 1;
   return (
      `<div>
            <table style="padding: 5px 2px; border: 1px solid #777; width: 100%">
               <caption style="padding: 4px;">Order Details:</caption>
                  <thead>
                     <tr style="line-height: 34px; text-align: center; font-weight: bold; letter-spacing: 0.4px; background: cyan; color: black">
                        <th style="border: '1px solid #777';">No.</th>
                        <th style="border: '1px solid #777';">Product</th>
                        <th style="border: '1px solid #777';">Price</th>
                        <th style="border: '1px solid #777';">Quantity</th>
                     </tr>
                  </thead>
                  <tbody>
                  ${Array.isArray(data) ? data.map((item: any) => {
         return (
            `<tr style="line-height: 30px; text-align: center; font-weight: bold; letter-spacing: 0.4px">
                           <td>${ind++}</td>
                           <td>${item?.title}</td>
                           <td>$ ${parseInt(item?.baseAmount + item?.shippingCharge)}</td>
                           <td>${item?.quantity} Pcs</td>
                        </tr>`
         )
      }) : `<tr style="line-height: 30px; text-align: center; font-weight: bold; letter-spacing: 0.4px"">
                  <td style="border: 1px solid #777;">${ind}</td>
                  <td style="border: 1px solid #777;">${data?.title}</td>
                  <td style="border: 1px solid #777;">$ ${data?.baseAmount}</td>
                  <td style="border: 1px solid #777;">${data?.quantity} Pcs</td>
            </tr>`
      }
                  </tbody>
                  <tfoot>
                     <tr>
                        <th colspan= "100%" align="center">
                           <p style="width: 100%; text-align: center; padding: 12px 0;">
                              Total amount: <b>${totalAmount} USD</b>
                           </p>
                        </th>
                     </tr>
                </tfoot>
            </table>
            <br/>
         </div>`
   )
}



module.exports.seller_order_email_template = (product: any) => {
   return (
      `<div>
         <h3 style="text-align: center">You have new order from ${product?.customerEmail}</h3>

         <table style="border: 1px solid #777; width: 100%">
          <caption style="padding: 4px;">Order Details:</caption>
            <thead>
               <tr style="line-height: 34px; text-align: center; font-weight: bold; letter-spacing: 0.4px; background: cyan; color: black">
                  <th style="border: 1px solid #777">Product</th>
                  <th style="border: 1px solid #777">Quantity</th>
                  <th style="border: 1px solid #777">SKU</th>
               </tr>
            </thead>
            <tbody>
               <tr style="line-height: 30px; text-align: center; font-weight: bold; letter-spacing: 0.4px">
                  <td style="border: 1px solid #777">${product?.title}</td>
                  <td style="border: 1px solid #777">${product?.quantity}</td>
                  <td style="border: 1px solid #777">${product?.sku}</td>
               </tr>
            </tbody>
            <tfoot>
               <tr>
                  <th colspan= "100%" align="center">
                     <p style="width: 100%; text-align: center; padding: 12px 0;">
                        Order ID: <b>${product?.orderID}</b> <br />
                        Tracking ID: <b>${product?.trackingID}</b> <br />
                        <i>Order At ${product?.orderAT?.time}, ${product?.orderAT?.date}</i>
                     </p>
                  </th>
               </tr>
            </tfoot>
         </table>
      </div>`
   )
}



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