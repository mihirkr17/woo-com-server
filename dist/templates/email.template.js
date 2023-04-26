"use strict";
module.exports.buyer_order_email_template = (data, totalAmount) => {
    let ind = 1;
    return (`<div>
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
                  ${Array.isArray(data) ? data.map((item) => {
        return (`<tr style="line-height: 30px; text-align: center; font-weight: bold; letter-spacing: 0.4px">
                           <td style="border: 1px solid #777">${ind++}</td>
                           <td style="border: 1px solid #777">${item === null || item === void 0 ? void 0 : item.title}</td>
                           <td style="border: 1px solid #777">$ ${item === null || item === void 0 ? void 0 : item.baseAmount}</td>
                           <td style="border: 1px solid #777">${item === null || item === void 0 ? void 0 : item.quantity}</td>
                        </tr>`);
    }) : `<tr style="line-height: 30px; text-align: center; font-weight: bold; letter-spacing: 0.4px"">
                  <td style="border: 1px solid #777;">${ind}</td>
                  <td style="border: 1px solid #777;">${data === null || data === void 0 ? void 0 : data.title}</td>
                  <td style="border: 1px solid #777;">$ ${data === null || data === void 0 ? void 0 : data.baseAmount}</td>
                  <td style="border: 1px solid #777;">${data === null || data === void 0 ? void 0 : data.quantity} Pcs</td>
            </tr>`}
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
         </div>`);
};
module.exports.seller_order_email_template = (product, customerEmail, orderID) => {
    const timestamp = Date.now();
    const time = new Date(timestamp).toLocaleTimeString();
    const date = new Date(timestamp).toDateString();
    return (`<div>
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
            <tbody>${Array.isArray(product) && product.map((item) => {
        return (`<tr style="line-height: 30px; text-align: center; font-weight: bold; letter-spacing: 0.4px">
                  <td style="border: 1px solid #777">${item === null || item === void 0 ? void 0 : item.itemID}</td>
                  <td style="border: 1px solid #777">${item === null || item === void 0 ? void 0 : item.title}</td>
                  <td style="border: 1px solid #777">${item === null || item === void 0 ? void 0 : item.quantity}</td>
                  <td style="border: 1px solid #777">${item === null || item === void 0 ? void 0 : item.sku}</td>
                  <td style="border: 1px solid #777">$ ${item === null || item === void 0 ? void 0 : item.baseAmount}</td>
            </tr>`);
    })}
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
      </div>`);
};
module.exports.verify_email_html_template = (verifyToken, email) => {
    return (`<table cellspacing="0" cellpadding="0" style="margin: 0 auto;">
   <tr>
      <td><h5>Verify your email address.</h5></td>
   </tr>
   <tr>
      <td align="center" bgcolor="#FFFFFF" style="padding: 1.3rem 1.4rem; border-radius: 4px;">
         <span style="font-weight: bold; 
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
         ">
         
            Your verification code is: ${verifyToken} <br />

            expired after 5 min. 
         </span>
      </td>
   </tr>
</table>`);
};
{ /* <tr style="line-height: 30px; text-align: center; font-weight: bold; letter-spacing: 0.4px">
<td style="border: 1px solid #777">${product?.title}</td>
<td style="border: 1px solid #777">${product?.quantity}</td>
<td style="border: 1px solid #777">${product?.sku}</td>
</tr> */
}
