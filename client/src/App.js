import React, { useState, useRef, useEffect } from "react";
import Peer from "peerjs";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("https://movie-app-9u7a.onrender.com");

export default function App() {
  const [room, setRoom] = useState("");
  const [password, setPassword] = useState("");
  const [joined, setJoined] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [playing, setPlaying] = useState(false);

  const localVideo = useRef();
  const remoteVideo = useRef();
  const movie = useRef();
  const peerRef = useRef();
  const localStreamRef = useRef();

  useEffect(() => {
    const peer = new Peer(undefined, { host:"movie-app-9u7a.onrender.com", port:5000, path:"/peerjs", secure:true });
    peer.on("open", id => {
      peerRef.current = peer;
    });
    peer.on("call", call => {
      navigator.mediaDevices.getUserMedia({ video:true, audio:true }).then(stream => {
        call.answer(stream);
        localVideo.current.srcObject = stream;
        localStreamRef.current = stream;
        call.on("stream", remote => setRemoteStream(remote));
      });
    });
    return () => peer.destroy();
  }, []);

  const joinRoom = () => {
  const peer = new Peer(undefined, {
  host: 'movie-app-9u7a.onrender.com',
  port: 443,
  path: '/peerjs',
  secure: true
});

peer.on("open", (id) => {
  console.log("Peer connected with ID:", id);
  
  // Now safe to emit to socket or join room
  socket.emit("join-room", roomId, id, userName);
});;
 socket.on("joined", ({ success, message }) => {
      if(success) {
        setJoined(true);
        navigator.mediaDevices.getUserMedia({video:true,audio:true}).then(stream => {
          localVideo.current.srcObject = stream;
          localStreamRef.current = stream;
        });
      } else alert(message);
    });
    socket.on("user-connected", peerId => {
      const call = peer.call(peerId, localStreamRef.current);
      call.on("stream", remote => setRemoteStream(remote));
    });
  };

  const toggleVideo = () => {
    const track = localStreamRef.current.getVideoTracks()[0];
    track.enabled = !track.enabled;
    setVideoOn(track.enabled);
  };
  const toggleMic = () => {
    const track = localStreamRef.current.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const handleSync = () => {
    if(playing) {
      movie.current.pause();
      socket.emit("sync-pause", room);
    } else {
      movie.current.play();
      socket.emit("sync-play", room);
    }
    setPlaying(!playing);
  };
  useEffect(() => {
    socket.on("sync-play", () => {
      movie.current.play();
      setPlaying(true);
    });
    socket.on("sync-pause", () => {
      movie.current.pause();
      setPlaying(false);
    });
  }, []);

  useEffect(() => {
    if(remoteVideo.current && remoteStream) remoteVideo.current.srcObject = remoteStream;
  }, [remoteStream]);

  return (
    <div className="App">
      {!joined ? (
        <div className="join-container">
          <h2>💕 Enter Your Room</h2>
          <input placeholder="Room" value={room} onChange={e=>setRoom(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div className="room-container">
          <h3>Your Room: {room}</h3>
          <div className="videos">
            <video ref={localVideo} autoPlay muted className="video-box"/>
            <video ref={remoteVideo} autoPlay className="video-box"/>
          </div>
          <div className="controls">
            <button onClick={toggleVideo}>{videoOn?"Camera Off":"Camera On"}</button>
            <button onClick={toggleMic}>{micOn?"Mute":"Unmute"}</button>
          </div>
          <div className="movie-player">
            <video ref={movie} width="400" src="https://www.w3schools.com/html/mov_bbb.mp4" />
            <button onClick={handleSync}>{playing?"Pause":"Play"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
