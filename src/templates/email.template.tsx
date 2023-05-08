
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
                           <td style="border: 1px solid #777">${ind++}</td>
                           <td style="border: 1px solid #777">${item?.title}</td>
                           <td style="border: 1px solid #777">$ ${item?.baseAmount}</td>
                           <td style="border: 1px solid #777">${item?.quantity}</td>
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



module.exports.seller_order_email_template = (product: any, customerEmail: string, orderID: string) => {
   const timestamp = Date.now();
   const time = new Date(timestamp).toLocaleTimeString();
   const date = new Date(timestamp).toDateString();
   return (
      `<div>
         <h3 style="text-align: center">You have new order From ${customerEmail} At ${time}, ${date}</h3>
         <p>Order ID: ${orderID}</p>

         <table style="border: 1px solid #777; width: 100%">
          <caption style="padding: 4px;">Order Details:</caption>
            <thead>
               <tr style="line-height: 34px; text-align: center; font-weight: bold; letter-spacing: 0.4px; background: cyan; color: black">
                  <th style="border: 1px solid #777">Item ID</th>
                  <th style="border: 1px solid #777">Product</th>
                  <th style="border: 1px solid #777">Qty</th>
                  <th style="border: 1px solid #777">SKU</th>
                  <th style="border: 1px solid #777">Amount</th>
               </tr>
            </thead>
            <tbody>${Array.isArray(product) && product.map((item: any) => {
         return (
            `<tr style="line-height: 30px; text-align: center; font-weight: bold; letter-spacing: 0.4px">
                  <td style="border: 1px solid #777">${item?.itemID}</td>
                  <td style="border: 1px solid #777">${item?.title}</td>
                  <td style="border: 1px solid #777">${item?.quantity}</td>
                  <td style="border: 1px solid #777">${item?.sku}</td>
                  <td style="border: 1px solid #777">$ ${item?.baseAmount}</td>
            </tr>`
         )
      })

      }
            </tbody>
            <tfoot>
               <tr>
                  <th colspan= "100%" align="center">
                     <p style="width: 100%; text-align: center; padding: 12px 0;">
                        WooKart Seller
                     </p>
                  </th>
               </tr>
            </tfoot>
         </table>
      </div>`
   )
}



module.exports.verify_email_html_template = (verifyToken: string, email: string) => {

   return (
      `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
      <div style="margin:50px auto;width:70%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
          <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">WooKart</a>
        </div>
        <p style="font-size:1.1em">Hi,</p>

        <p>Thank you for choosing WooKart. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>

        <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${verifyToken}</h2>

        <p style="font-size:0.9em;">Regards,<br />WooKart</p>

        <hr style="border:none;border-top:1px solid #eee" />

        <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
          <p>WooKart Inc</p>
          <p>Lalmonirhat, 5510</p>
          <p>Bangladesh</p>
        </div>

      </div>
    </div>`
   );
}