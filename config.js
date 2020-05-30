require('dotenv').config();
const CryptoJS = require("crypto-js");

class Config {

    encrypt(param) {
        return CryptoJS.AES.encrypt(param, process.env.KEY).toString()
    }

    decrypt(param) {
        if (!param)
            return null
        return CryptoJS.AES.decrypt(param, process.env.KEY).toString(CryptoJS.enc.Utf8)
    }

}

module.exports = Config