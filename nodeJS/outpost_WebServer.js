const express = require('express');
const fs = require('fs');
var path = require('path');
const { fork } = require('node:child_process');
var cors = require('cors') ;
const request = require('request');


const app = express();
app.use(express.static('/Users/alexszhanggmail.com/github/outpost')) ;
app.use(express.static('/Users/alexszhanggmail.com/github/yt-dlp')) ;

app.use('/node_modules', express.static('node_modules'));
app.use(express.json());
app.use(cors()) ;



const webPort = 3010 ;
app.listen(webPort, () => {
  console.log(`outpost_WebServer: listening on port ${webPort}`);
});

app.get('/tts', (req, res) => {
  const text = req.query.q || 'สวัสดี';
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=th&client=tw-ob`;

  request({ url, headers: { 'User-Agent': 'Mozilla/5.0' } }).pipe(res);
});


app.get('/ttsAvailable', (req, res) => {
  console.log('/ttsAvailable') ;
  res.json({retCode:"200"}) ;
});
