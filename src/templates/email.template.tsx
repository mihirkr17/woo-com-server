

module.exports.seller_order_email_template = (product: any, customerEmail: string, orderIDs: any[], totalAmount: number) => {
   const timestamp = Date.now();
   const time = new Date(timestamp).toLocaleTimeString();
   const date = new Date(timestamp).toDateString();
   return (
      `<div>
         <h3 style="text-align: center">You have new order From ${customerEmail} At ${time}, ${date}</h3>
         <p>Order ID: ${orderIDs.join(", ") ?? ""}</p>
         <b>Total Amount : ${totalAmount}</b>

         <table style="border: 1px solid #777; width: 100%">
          <caption style="padding: 4px;">Order Details:</caption>
            <thead>
               <tr style="line-height: 34px; text-align: center; font-weight: bold; letter-spacing: 0.4px; background: cyan; color: black">
                  <th style="border: 1px solid #777">Order ID</th>
                  <th style="border: 1px solid #777">Product</th>
                  <th style="border: 1px solid #777">Qty</th>
                  <th style="border: 1px solid #777">SKU</th>
                  <th style="border: 1px solid #777">Amount</th>
               </tr>
            </thead>
            <tbody>${Array.isArray(product) && product.map((item: any) => {
         return (
            `<tr style="line-height: 30px; text-align: center; font-weight: bold; letter-spacing: 0.4px">
                  <td style="border: 1px solid #777">${item?.order_id}</td>
                  <td style="border: 1px solid #777">${item?.product?.title}</td>
                  <td style="border: 1px solid #777">${item?.quantity}</td>
                  <td style="border: 1px solid #777">${item?.product?.sku}</td>
                  <td style="border: 1px solid #777">$ ${item?.product?.baseAmount}</td>
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



module.exports.verify_email_html_template = (verifyToken: string, fullName: string, appUri: string) => {

   return (
      `
      <table border="0" cellspacing="0" cellpadding="0">
   <tbody>
      <tr>
         <td>
            <p
               style="text-align:left;color:#333333;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;margin:0px;padding:0;margin-top:10px;font-weight:bold">
               Dear ${fullName}
            </p>
         </td>
      </tr>
      <tr>
         <td>
            <p
               style="text-align:left;color:#333333;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;margin:0px;padding:0;margin-top:10px;font-weight:normal">
               Thank you for applying for a WooKart account.
               <br>
               To help us confirm it’s you, please verify your email address.
            </p>
         </td>
      </tr>
      <tr>
         <td>
               <a style="display:block; width: 160px;border:6px solid rgb(239,239,239);margin: 20px 0;padding:12px 10px; text-decoration:none;font-family:Arial,Helvetica,sans-serif;color:#fff;background:#ff4800;text-align:center"
                  href="${appUri}api/v1/auth/verify-email?token=${verifyToken}">
                  <span
                     style="text-decoration:none!important;color:#fff;font-size:16px;line-height:28px;text-align:center;display:block">
                     &nbsp;&nbsp;VERIFY MY EMAIL&nbsp;&nbsp;
                  </span>
               </a>
         </td>
      </tr>
      <tr>
         <td>
  
         <p
            style="text-align:left;color:#333333;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;margin:0px;padding:0;margin-top:10px;font-weight:normal">
            If you were not expecting this email, or you think you received it in error,
         </p>

         <br><br>
         <p
            style="text-align:left;color:#333333;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;margin:0px;padding:0;margin-top:10px;font-weight:normal">
            Thank you <br>
            The WooKart Team
         </p>
         </td>
      </tr>
   </tbody>
</table>
      `
   );
}



module.exports.send_six_digit_otp_template = (otp: string, fullName: string) => {

   return (
      `
      <table border="0" cellspacing="0" cellpadding="0">
   <tbody>
      <tr>
         <td>
            <p
               style="text-align:left;color:#333333;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;margin:0px;padding:0;margin-top:10px;font-weight:bold">
               Dear ${fullName}
            </p>
         </td>
      </tr>
      <tr>
         <td>
            <p
               style="text-align:left;color:#333333;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;margin:0px;padding:0;margin-top:10px;font-weight:normal">
               Thank you for applying for a WooKart account.
               <br>
               To help us confirm it’s you, Your Otp.
            </p>
         </td>
      </tr>
      <tr>
         <td>
               <p style="display:block; width: 160px;border:6px solid rgb(239,239,239);margin: 20px 0;padding:12px 10px; text-decoration:none;font-family:Arial,Helvetica,sans-serif;color:#fff;background:#ff4800;text-align:center"
                 >
                  <span
                     style="text-decoration:none!important;color:#fff;font-size:16px;line-height:28px;text-align:center;display:block">
                     &nbsp;&nbsp;W- ${otp}&nbsp;&nbsp;
                  </span>
               </p>
         </td>
      </tr>
      <tr>
         <td>
  
         <p
            style="text-align:left;color:#333333;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;margin:0px;padding:0;margin-top:10px;font-weight:normal">
            If you were not expecting this email, or you think you received it in error,
         </p>

         <br><br>
         <p
            style="text-align:left;color:#333333;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;margin:0px;padding:0;margin-top:10px;font-weight:normal">
            Thank you <br>
            The WooKart Team
         </p>
         </td>
      </tr>
   </tbody>
</table>
      `
   );
}



module.exports.buyer_order_email_template = (data: any, option: any) => {

   return (`<div>
   <table border="0" align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:100%;background:#e9e9e9;padding:50px 0px">
      <tr>
         <td>
            <table border="0" align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;padding:0px 25px">
               <tbody>
                  <tr>
                     <td style="margin:0;padding:0">
                        <table border="0" cellpadding="20" cellspacing="0" width="100%" style="background:#ffffff;color:#1a1a1a;line-height:150%;text-align:center;border-bottom:1px solid #e9e9e9;font-family:300 14px &#39;Helvetica Neue&#39;,Helvetica,Arial,sans-serif">
                           <tbody>
                              <tr>
                                 <td valign="top" align="center" width="100" style="background-color:#ffffff">
                                       <h1 style="font-size: 24px;font-weight:bolder;color:orange">WooKart</h1>
                                 </td>
                              </tr>
                           </tbody>
                        </table>

                        <br />

                        <table border="0" cellpadding="" cellspacing="0" width="100%" style="background:#ffffff;color:#000000;line-height:150%;text-align:center;font:300 16px &#39;Helvetica Neue&#39;,Helvetica,Arial,sans-serif">
                           <tbody>
                              <tr>
                                 <td valign="top" width="100">
                                    <h1 data-key="1468266_heading" style="font-family: Georgia,serif,'Playfair Display'; font-size: 28px; line-height: 46px; font-weight: 700; color: #4b4b4b; text-transform: none; background-color: #ffffff; margin: 0;">
                                       Order Confirmation
                                    </h1>
                                 </td>
                              </tr>
                           </tbody>
                        </table>
                        <br />
                        <table border="0" cellpadding="20" cellspacing="0" width="100%" style="color:#000000;line-height:150%;text-align:left;font:300 16px &#39;Helvetica Neue&#39;,Helvetica,Arial,sans-serif">
                           <tbody>
                              <tr>
                                 <td valign="top">
                                    <h6 style="display:inline-block;font-family:Arial;font-size:15px;font-weight:bold;margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-align:left;line-height:100%">
                                       Placed At: (${option?.timeObject?.time}, ${option?.timeObject?.date})
                                    </h6>
                                 </td>
                              </tr>
                           </tbody>
                        </table>
                        <table align="center" cellspacing="0" cellpadding="6" width="95%" style="border:0;color:#000000;line-height:150%;text-align:left;font:300 14px/30px &#39;Helvetica Neue&#39;,Helvetica,Arial,sans-serif;" border=".5px">
                           <thead>
                              <tr style="background:#efefef">
                                 <th scope="col" width="30%" style="text-align:left;border:1px solid #eee">Product</th>
                                 <th scope="col" width="30%" style="text-align:left;border:1px solid #eee">Title</th>
                                 <th scope="col" width="15%" style="text-align:right;border:1px solid #eee">Quantity</th>
                                 <th scope="col" width="20%" style="text-align:right;border:1px solid #eee">Price</th>
                              </tr>
                           </thead>
                           <tbody>

                           ${data?.map((item: any) => {
      return (
         `
                                    <tr width="100%">
                                    <td>
                                       <img src=${item?.product?.assets?.images[0] ?? ""} alt="item_image" width="60" height="60" style="object-fit: contain;" />
                                    </td>
                                    <td width="30%" style="text-align:left;vertical-align:middle;border-left:1px solid #eee;border-bottom:1px solid #eee;border-right:0;border-top:0;word-wrap:break-word">
                                       <b>${item?.product?.title}</b> <br />
                                       <small>
                                          Order ID: ${item?.order_id} <br />
                                          Payment Mode: ${item?.payment?.mode}
                                       </small>

                                    </td>
                                    <td width="15%" style="text-align:right;vertical-align:middle;border-left:1px solid #eee;border-bottom:1px solid #eee;border-right:0;border-top:0">
                                    ${item?.quantity}
                                    </td>
                                    <td width="20%" style="text-align:right;vertical-align:middle;border-left:1px solid #eee;border-bottom:1px solid #eee;border-right:1px solid #eee;border-top:0">
                                       <span>BDT ${item?.product?.base_amount}</span>
                                    </td>
                                 </tr>
                                    `
      )
   })
      }

                            
                           </tbody>

                           <tfoot>
                              <tr>

                                 <th scope="row" width="80%" colspan="2" style="text-align:right;vertical-align:middle;border-left:1px solid #eee;border-bottom:1px solid #eee;border-right:0;border-top:0">
                                    Cart Subtotal
                                 </th>
                                 <th width="20%" style="text-align:right;vertical-align:middle;border-left:1px solid #eee;border-bottom:1px solid #eee;border-right:1px solid #eee;border-top:0">
                                    <span>BDT ${option?.cartTotal}</span>
                                 </th>
                              </tr>

                              <tr>
                                 <th scope="row" width="80%" colspan="2" style="text-align:right;vertical-align:middle;border-left:1px solid #eee;border-bottom:1px solid #eee;border-right:0;border-top:0">
                                    Shipping Charges
                                 </th>
                                 <td width="20%" style="text-align:right;vertical-align:middle;border-left:1px solid #eee;border-bottom:1px solid #eee;border-right:1px solid #eee;border-top:0">
                                    <span>BDT ${option?.shippingTotal}</span>
                                 </td>
                              </tr>

                              <tr>
                                 <th width="80%" scope="row" colspan="2" style="text-align:right;background:#efefef;text-align:right;border-left:1px solid #eee;border-bottom:1px solid #eee;border-right:0;border-top:0">
                                    Order Total
                                 </th>
                                 <td width="20%" style="background:#efefef;text-align:right;vertical-align:middle;border-left:1px solid #eee;border-bottom:1px solid #eee;border-right:1px solid #eee;border-top:0;color:#7db701;font-weight:bold">
                                    <span>${option?.totalAmount}</span>
                                 </td>
                              </tr>
                           </tfoot>
                        </table>
                        <br />
                        <br />
                        <table border="0" cellpadding="20" cellspacing="0" width="100%" style="color:#000000;line-height:150%;text-align:left;font:300 14px &#39;Helvetica Neue&#39;,Helvetica,Arial,sans-serif">
                           <tbody>
                              <tr>
                                 <td valign="top">
                                    <h4 style="font-size:24px;margin:0;padding:0;margin-bottom:10px;">Customer Details</h4>
                                    <p style="margin:0;margin-bottom:10px;padding:0;">
                                       <strong>Email:</strong> 
                                    <a href="mailto:${option?.email}" target="_blank">${option?.email}</a></p>
                                    <p style="margin:0;margin-bottom:10px;padding:0;"><strong>Tel:</strong> ${option?.shippingAddress?.phone_number}</p>
                                 </td>
                              </tr>
                           </tbody>
                        </table>
                        <table border="0" cellpadding="20" cellspacing="0" width="100%" style="color:#000000;line-height:150%;text-align:left;font:300 14px &#39;Helvetica Neue&#39;,Helvetica,Arial,sans-serif">
                           <tbody>
                              <tr>
                                 <td valign="top">
                                    <h4 style="font-size:24px;margin:0;padding:0;margin-bottom:10px;">Delivery address</h4>
                                    <p>
                                      ${option?.shippingAddress?.name}
                                       <br /> ${option?.shippingAddress?.area}, ${option?.shippingAddress?.city}, ${option?.shippingAddress?.division}
                                       <br />
                                       <br /> ${option?.shippingAddress?.landmark}
                                    </p>
                                 </td>
                              </tr>
                           </tbody>
                        </table>
                        <br />
                        <br />

                        <table cellspacing="0" cellpadding="6" width="100%" style="color:#000000;line-height:150%;text-align:left;font:300 16px &#39;Helvetica Neue&#39;,Helvetica,Arial,sans-serif" border="0">
                           <tbody>
                              <tr>
                                 <td valign="top" style="text-transform:capitalize">
                                    <p style="font-size:12px;line-height:130%">Please call <b> 212456</b> in case of any doubts or questions. Please reply back to email in case of any issues with prices, packing charges, taxes and other menus issues.</p>
                                 </td>
                              </tr>
                           </tbody>
                        </table>
                        <br />

                        <br />
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="border-top:1px solid #e9e9e9;border-bottom:1px solid #e9e9e9;font-family:Arial,Helvetica,sans-serif;font-size:12px;padding:0px">
                           <tbody>
                              <tr>
                                 <td align="left" width="33%">
                                    <table border="0" cellspacing="0" cellpadding="0" style="font-family:Arial,Helvetica,sans-serif;font-size:12px">
                                       <tbody>
                                          <tr>
                                             <td width="60%">Download the App: </td>
                                             <td width="5%"> </td>
                                             <td width="15%">
                                                <a href="http://swiggy.com/app?utm_source=swiggy&amp;utm_medium=partner-mails" target="_blank">
                                                   <img style="max-height:20px;width:auto" src="https://res.cloudinary.com/swiggy/image/upload/v1447855172/Android_qt1acy.png" /></a>
                                             </td>
                                             <td width="5%"> </td>
                                             <td width="15%">
                                                <a href="http://swiggy.com/app?utm_source=swiggy&amp;utm_medium=partner-mails" target="_blank">
                                                   <img style="max-height:20px;width:auto" src="https://res.cloudinary.com/swiggy/image/upload/v1447855170/Apple_e7lnfc.png" /></a>
                                             </td>
                                          </tr>
                                       </tbody>
                                    </table>
                                 </td>
                                 <td align="center" width="47%">
                                    <table border="0" cellspacing="0" cellpadding="0" height="50" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9b9b9b">
                                       <tbody>
                                          <tr>
                                             <td align="center">
                                                © 2021-WooKart. All rights reserved.
                                             </td>
                                          </tr>
                                       </tbody>
                                    </table>
                                 </td>
                                 <td align="right" width="20%">
                                    <table border="0" cellspacing="0" cellpadding="0" height="50" style="font-family:Arial,Helvetica,sans-serif;font-size:12px">
                                       <tbody>
                                          <tr>
                                             <td width="5%"> </td>
                                             <td width="20%">
                                                <a href="https://www.facebook.com/swiggy.in" target="_blank">
                                                    <img style="max-height:20px;width:auto" src="https://res.cloudinary.com/swiggy/image/upload/v1447855170/Facebook_ezoqwy.png" alt="Swiggy Facebook" style="display:block" border="0" /> 
                                                </a>
                                             </td>
                                             <td width="5%"> </td>
                                             <td width="20%">
                                                <a href="https://twitter.com/swiggy_in" target="_blank">
                                                   <img style="max-height:20px;width:auto" src="https://res.cloudinary.com/swiggy/image/upload/v1447855171/Twitter_stmvbr.png" alt="Swiggy Twitter" style="display:block" border="0" /> 
                                                </a>
                                             </td>
                                          </tr>
                                       </tbody>
                                    </table>
                                 </td>
                              </tr>
                           </tbody>
                        </table>
                        <br />
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;padding:0px;font-size:12px;color:#9b9b9b;">
                           <tbody>
                              <tr>
                                 <td align="center" width="33.3333%">
                                    Aditmari,Tower D, 2th Floor, Patgram Road, Lalmonirhat - 5510
                                 </td>
                              </tr>
                           </tbody>
                        </table>
                        <br />
                     </td>
                  </tr>
               </tbody>
            </table>
         </td>
      </tr>
   </table>

</div>`)
}



