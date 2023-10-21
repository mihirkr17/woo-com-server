"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
/**
 *
 * @param option
 * @returns
 */
function smtpSender(option) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { to, subject, html } = option;
            if (!to) {
                return;
            }
            const OAuth2_client = new OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET);
            OAuth2_client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
            const accessToken = OAuth2_client.getAccessToken();
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PWD,
                    clientId: process.env.GMAIL_CLIENT_ID,
                    clientSecret: process.env.GMAIL_CLIENT_SECRET,
                    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
                    accessToken
                }
            });
            const info = yield transporter.sendMail({
                from: process.env.GMAIL_USER,
                to,
                subject,
                html
            });
            return info;
        }
        catch (error) {
            return error;
        }
    });
}
module.exports = smtpSender;
