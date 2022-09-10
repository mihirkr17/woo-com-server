"use strict";
class UserModel {
    constructor(body, email) {
        this.email = email;
        this.displayName = body === null || body === void 0 ? void 0 : body.name;
        this.photoURL = body === null || body === void 0 ? void 0 : body.photoURL;
        this.role = "user";
    }
    //   isValidUrl(url:string) {
    //     var urlPattern = new RegExp(
    //       "^(https?:\\/\\/)?" + // validate protocol
    //         "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
    //         "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
    //         "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
    //         "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
    //         "(\\#[-a-z\\d_]*)?$",
    //       "i"
    //     ); // validate fragment locator
    //     return !!urlPattern.test(url);
    //   }
    errorReports() {
        if (this.displayName === "" || typeof this.displayName === "undefined") {
            return `DisplayName Required !`;
        }
        //  let validUrl = this.isValidUrl(this.photoURL);
        //  if (this.photoURL === "" || typeof this.photoURL === "undefined" || !this.photoURL) {
        //    return `PhotoURL Required !`;
        //  }
        //  if (!validUrl) {
        //    return "Provided url address is not valid !"
        //  }
        return false;
    }
}
module.exports = UserModel;