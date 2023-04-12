
module.exports.buyer_order_email_template = (data: any, totalAmount: number) => {

   let ind = 1;
   return (
      `<div>
            <table style="padding: '5px 2px'">
               <caption style="padding: '4px'; background-color: 'black'; color: 'white'">Order Details:</caption>
                  <thead>
                     <tr>
                        <th>No.</th>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                     </tr>
                  </thead>
                  <tbody>
                  ${Array.isArray(data) ? data.map((item: any) => {
         return (
            `<tr>
                           <td>${ind++}</td>
                           <td>${item?.title}</td>
                           <td>$ ${parseInt(item?.baseAmount + item?.shippingCharge)}</td>
                           <td>${item?.quantity} Pcs</td>
                        </tr>`
         )
      }) : `<tr>
                  <td>${ind}</td>
                  <td>${data?.title}</td>
                  <td>$ ${data?.baseAmount}</td>
                  <td>${data?.quantity} Pcs</td>
            </tr>`
      }
                  </tbody>
                  <tfoot>
                     <tr>
                        <th colspan= "100%">
                           <b style="width: '100%'; text-align: 'center'; background-color: 'black'; color: 'white'">
                              Total amount: ${totalAmount} USD
                           </b>
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
         <h3>You have new order from ${product?.customerEmail}</h3>
         <p>
            <pre>
               Item Name     : ${product?.title} <br />
               Item SKU      : ${product?.sku} <br />
               Item Quantity : ${product?.quantity} <br />
               Item Price    : ${product?.baseAmount} usd
            </pre>
         </p>
         <br />
         <span>Order ID: <b>${product?.orderID}</b></span> <br />
         <i>Order At ${product?.orderAT?.time}, ${product?.orderAT?.date}</i>
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