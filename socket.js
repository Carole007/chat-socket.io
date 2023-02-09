const { createServer } = require("http");
const express = require('express');
const json = require('jsonfile')
const fs = require("fs");
app = express();
const server = createServer(app);
const io = require('socket.io')(server, {
  path: '/socket/',
  // cors: true//跨域
});
app.use('/', express.static('./public'))
server.on('listen', (req, res) => {
  if (req.url == '/') {
    res.setheader('Content-Type', 'text/html');
    let data = fs.readFileSync('public/index.html', 'utf8')
    res.end(data)
  }
})
//连接的所有用户
let peoples = []
//连接时
io.on("connection", (socket) => {
  let user = socket.handshake.query.name
  console.log(`${user}加入了聊天室`);

  if (peoples.includes(user)) {
    return socket.emit('nouse', '用户已经存在')
  }
  peoples.push(user)
  //向所有用户发送有新用户加入
  io.emit('newuser join', peoples, socket.id)
  //收到客户端的消息
  socket.on('client message', (data) => {
    appendData(data)
    
    console.log(`${user}发送了一条新消息：${data.message}`)
    //转发除了自己的所有在线客户端
    socket.broadcast.emit('server message', data)
  })
  //客户端退出
  socket.on('disconnect', () => {
    peoples.splice(peoples.indexOf(user), 1)
    console.log(`${user}:退出了聊天室`);
    io.emit('quit', user)
  })
});

function appendData(input) {
  json.readFile('./public/data.json').then(data => {
    if (data.length > 50) {
      data.splice(0, 10)
    }
    data.push(input)
    json.writeFile('./public/data.json', data, (err, data) => {
      if (err) {
        console.log(err);
      }
    })
  }).catch(err => {
    console.log(err);
  })
}
server.listen(6767);