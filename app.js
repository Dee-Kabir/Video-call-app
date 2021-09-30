const express = require('express')
const path = require('path');
const http = require('http')
const app = express();
const server = http.createServer(app)
const io = require('socket.io')(server, {
    path: "/socketPath"
})

app.use(express.static(path.join(__dirname, "/client/build")));

app.get('/', (req, res, next) => res.sendFile(path.join(__dirname, "client", "build", "index.html")));

io.on("connection",(socket)=>{
    socket.emit("me", socket.id)
    
    socket.on("disconnectCall",(data)=>{
        io.to(data.to).emit("callEnded",{message: "call Ended"})
        io.to(data.from).emit("callEnded",{message: "call Ended"})
    })

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser",{signal: data.signalData,from : data.from, name: data.name})
    })

    socket.on("answerCall",(data) => {
        io.to(data.to).emit("callAccepted",data.signal)
    })
    
    socket.on("busy",data =>{
        io.to(data.to).emit("busy",{message: data.message})
    })
})
const PORT = process.env.PORT || 5000

server.listen(PORT, () => console.log("server is running"))