const User = require('./User')
const Message = require('./Message')

class Game {

    id;
    name = ""
    state = false;
    actif = true;
    players = new Array(new User);
    messages = new Array(new Message);
}

module.exports = Game