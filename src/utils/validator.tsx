function validString(str: string) {
   return (/^(?:\d+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(?=.*[a-z])(?=.*[A-Z]).+)$/).test(str);
}

function validEmail(email: any) {
   const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
   return re.test(String(email).toLowerCase());
}

function validPassword(password: string) {
   return (/^(?=.*\d)(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{5,}$/).test(password);
}


function validDigit(input: any) {
   return (/^\d*$/).test(input);
}


/**
 * [Valid Bangladeshi sim phone numbers]
 * @param inp 
 * @returns 
 */
function translateToEnglish(inp: string): string {
   const FORMAT: any = {
      "০": 0, "১": 1, "২": 2, "৩": 3, "৪": 4, "৫": 5, "৬": 6, "৭": 7, "৮": 8, "৯": 9
   }

   let number: string = "";
   inp.trim().split("").forEach((element: any) => {

      if (isNaN(element)) {
         number += FORMAT[element];
      } else {
         number += element;
      }
   });

   return number;
}

function validBDPhoneNumber(inputPhoneNumber: string): boolean | string {

   const number = translateToEnglish(inputPhoneNumber);

   const numberRegex = /^1[13-9]\d{8}$/gm;

   let numberTest = numberRegex.test(number);

   if (numberTest) {
      return number;
   } else {
      return false;
   }
}


module.exports = { validBDPhoneNumber, validEmail, validPassword, validDigit, validString }