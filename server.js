var fs = require("fs");
var server = require("http").createServer(function(req, res) {
     res.writeHead(200, {"Content-Type":"text/html"});
     var output = fs.readFileSync("./index.html", "utf-8");
     res.end(output);
}).listen(9999);
var io = require("socket.io").listen(server);

var NeDB = require('nedb');
var db = {};
db.comment = new NeDB({
  filename: 'commentfile'
});

db.comment.loadDatabase();

io.on('connection', function (socket) {

  db.comment.find({}, function(err, docs){
    console.log("[FIND]");
    console.log(docs);
    io.emit("initMessageToClient", docs);
  })
  var enterTime = new Date();

  // 入室通知
  io.emit("sendMessageToClient", {value:"1人入室しました。", datetime: enterTime.getTime()});

  // 投稿内容を他のブラウザに通知
  socket.on("sendMessageToServer", function (data) {
    var time = new Date();
    // nedb使って保存
    db.comment.insert(
        [{comment: data, datetime: time.getTime()}]
      , function(err, newDoc){
        console.log("[INSERT]");
        console.log(newDoc);
    });
    io.emit("sendMessageToClient", {value:data.value, datetime: time.getTime()});
  });

  // 退室通知
  socket.on("disconnect", function () {
      io.emit("sendMessageToClient", {value:"1人退室しました。"});
  });
});