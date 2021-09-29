const express = require('express')
const http = require('http')
const app = express();
require("dotenv").config();
const path = require("path");
const server = http.createServer(app)
const io = require('socket.io')(server, {
    cors : {
        origin : "http://localhost:3000",
        methods: ["GET","POST"]
    }
})

io.on("connection",(socket)=>{
    socket.emit("me", socket.id)
    
    socket.on("disconnect",()=>{
        socket.broadcast.emit("callEnded")
    })

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser",{signal: data.signalData,from : data.from, name: data.name})
    })

    socket.on("answerCall",(data) => {
        io.to(data.to).emit("callAccepted",data.signal)
    })

})

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/client/build")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "client", "build", "index.html"));
    });
  } else {
    app.get("/", (req, res) => {
      res.send("API Running");
    });
  }
const PORT = process.env.PORT
app.listen(PORT || 8000, () => {
    console.log("connected");
});