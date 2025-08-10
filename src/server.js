const http = require('http');
const app = require('./app');
const socketManager = require('./sockets');

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
socketManager.attach(server);
server.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
