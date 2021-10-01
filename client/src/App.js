import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import MicButton from "@material-ui/icons/Mic"
import MicOffButton from "@material-ui/icons/MicOff"
import VideoCamButton from "@material-ui/icons/Videocam"
import VideoCamOffButton from "@material-ui/icons/VideocamOff"
import EndCallButton from "@material-ui/icons/PhoneDisabled"
import PhoneIcon from "@material-ui/icons/Phone"
import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import {io} from "socket.io-client"
import "./App.css"

let socket = io('/',{
	path: "/socketPath"
})
socket = socket.connect()
function App() {
	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ name, setName ] = useState("")
	const [callerName,setCallerName] = useState("")
	const [micOn,setMicOn] = useState(true);
	const [cameraOn,setCameraOn] = useState(true);
	const [message, setMessage] = useState("");
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
				myVideo.current.srcObject = stream
		})

	socket.on("me", (id) => {
			setMe(id)
		})
		socket.on("callUser", (data) => {
			if(receivingCall){
				socket.emit("busy",{
					message: "Busy on another call",
					to : data.from
			})
			}else{
				setReceivingCall(true)
				setCaller(data.from)
				setCallerName(data.name)
				setCallerSignal(data.signal)
			}
		})
		socket.on("callEnded",(data)=>{
			window.location.reload()
		})
	}, [])

	const callUser = (id) => {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on('error', function (err) { console.log('error', err) })
		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: cameraOn ? data : "",
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})
		socket.on("busy",(data)=>{
			setMessage(data.message)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on('error', function (err) { console.log('error', err) })
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnded(true)
		setCallAccepted(false)
		socket.emit("disconnectCall",{message: 'disconnect call',to: caller,from:me})
		connectionRef.current.destroy()
	}
	function toggleMic() {
		let enabled = stream.getAudioTracks()[0].enabled;
		if (enabled) {
			stream.getAudioTracks()[0].enabled = false;
			setMicOn(false)
		} else {
			setMicOn(true)
			stream.getAudioTracks()[0].enabled = true;
		}
	}
	function toggleCamera() {
		let enabled = stream.getVideoTracks()[0].enabled;
	if (enabled) {
		stream.getVideoTracks()[0].enabled = false;
		setCameraOn(false)
		// userMediaContainers.get("local-user").removeVideo();
	} else {
		// document.getElementById('video-logo').innerHTML = room_svg.videoOn;
		stream.getVideoTracks()[0].enabled = true;
		setCameraOn(true)
		// userMediaContainers.get("local-user").addVideo();
	}
	}
	return (
		<>
			<h1 style={{ textAlign: "center", color: '#fff' }}>Zoomish</h1>
		<div className="container">
		{message && <p style={{fontSize: "20px"}}>{message}</p>}
			<div className="video-container">
				<div className="video">
					{stream &&  <div style={{ width: "200px",position: "absolute",zIndex: '10',left: '0px',bottom:'10px' }}>
						<video playsInline muted ref={myVideo} autoPlay style={{width: '100%',height:'100%'}} />
						<p style={{backgroundColor: 'black',color: 'white',position:'absolute',right:'0px',bottom:'0px',margin:'0px'}}>{name}</p>
						</div>}
				</div>
				<div className="video">
					{callAccepted && !callEnded ?
					<div style={{position:'absolute',top:'0px',left:'0px',height:'98vh',width:'100vw'}}>
					<video playsInline ref={userVideo} autoPlay style={{width: '100%',height:'100%'}}  />
					<p style={{backgroundColor: 'black',color: 'white',position:'absolute',right:'0px',bottom:'0px',margin:'0px'}}>{callerName}</p>
					</div>:
					null}
				</div>
			</div>
			{!callAccepted && !callEnded ? <div className="myId">
			<TextField
				id="filled-basic"
				label="Name"
				variant="filled"
				value={name}
				onChange={(e) => setName(e.target.value)}
				style={{ marginBottom: "20px" }}
			/>
			<CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
				<Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
					Copy ID
				</Button>
			</CopyToClipboard>

			<TextField
				id="filled-basic"
				label="ID to call"
				variant="filled"
				value={idToCall}
				onChange={(e) => setIdToCall(e.target.value)}
			/>
			<div className="call-button">
				
					<IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
						<PhoneIcon fontSize="large" />
					</IconButton>
			
				{idToCall}
			</div>
		</div>: null}
			<div>
				{receivingCall && !callAccepted ? (
						<div className="caller">
						<h1 >{callerName} is calling...</h1>
						<Button variant="contained" color="primary" onClick={answerCall}>
							Answer
						</Button>
					</div>
				) : null}
			</div>
			
			
			<div style={{position: 'absolute',bottom: '0px',textAlign:'center',width:'100%'}}>
			<IconButton color="primary" aria-label="mic" onClick={() => toggleMic()}>{micOn ? <MicButton fontSize="large"/> : <MicOffButton fontSize="large" />}</IconButton>
			<IconButton color="primary" aria-label="mic" onClick={() => toggleCamera()}>{cameraOn ? <VideoCamButton fontSize="large"/> : <VideoCamOffButton fontSize="large" /> }</IconButton>
			{callAccepted && <IconButton color="primary" aria-label="end call" onClick={leaveCall}>
			<EndCallButton fontSize="large" />
		</IconButton>}
			</div>
				
			
		</div>
		</>
	)
}

export default App