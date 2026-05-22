const dotenv = require('dotenv');
dotenv.config();
const http = require('http');
const App = require('./app.js');

const server = http.createServer(App);

server.listen(process.env.PORT || 5001, console.log(`Server started on PORT :: ${process.env.PORT || 5001}`));