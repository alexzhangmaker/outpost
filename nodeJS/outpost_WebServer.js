const express = require('express');
const fs = require('fs');
var path = require('path');
const { fork } = require('node:child_process');
var cors = require('cors') ;


const app = express();
app.use(express.static('/Users/alexszhanggmail.com/github/outpost')) ;
app.use('/node_modules', express.static('node_modules'));
app.use(express.json());
app.use(cors()) ;



const webPort = 3010 ;
app.listen(webPort, () => {
  console.log(`outpost_WebServer: listening on port ${webPort}`);
});