import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Badge, IconButton, TextField } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import SendIcon from '@mui/icons-material/Send';

import "../App.css"
import WithAuth from "../utils/withAuth";


//////////////// optimize the whole project with concern of separation and dividing the components /////////////////

const server_url = "http://localhost:8000";

let connections = {}; // sb ki socket id mantain ho rhi h idhr

const peerConfigConnections = {
  iceServers: [
  { 
    urls: "stun:stun.l.google.com:19302" 
  }
],
};

function VideoMeet() {

  const [isLoading, setIsLoading] = useState(true);

  let socketRef = useRef();  //socket reference like when we do io.connection we got an socket instance of the connected socket from which we can do things we want

  let socketIdRef = useRef(); // apna socketId jb hum connect krenge khi or --> ye apn chat function ke liye use krenge

  let localVideoref = useRef(); // hamara video 

  let [videoAvailable, setVideoAvailable] = useState(true);

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [screenAvailable, setScreenAvailable] = useState();

  let [video, setVideo] = useState();  // state for on/off

  let [audio, setAudio] = useState();   // state for on/off

  let [screen, setScreen] = useState();

  let [showModal, setModal] = useState(true);

  let [messages, setMessages] = useState([]);  //sare messages

  let [message, setMessage] = useState("");   //when we type the current message

  let [newMessages, setNewMessages] = useState(0);   //for notification

  let [askForUsername, setAskForUsername] = useState(true);   //when user is logging with guest

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);  // other than us all other videos

  let [videos, setVideos] = useState([]); 

  const chatContainerRef = useRef();

  // TODO
  // if(isChrome() === false) {

  // }


  useEffect(() => {
    console.log("The component has mounted....");
    getPermissions();
  }, []);

  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
        console.log("Video permission granted");
      } else {
        setVideoAvailable(false);
        console.log("Video permission denied");
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log("Audio permission granted");
      } else {
        setAudioAvailable(false);
        console.log("Audio permission denied");
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });

        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
      console.log("Video on: ", video, " Audio on: ", audio);
    }
  }, [video, audio]);


  let getMedia = () => {

    //this part is already done in the lobby so we can do this
    setVideo(videoAvailable);
    setAudio(audioAvailable);

    //just after above line one useEffect will run after that the lower fn will execute

    connectToSocketServer()
  };


  //it is used to capture the user's local video and audio stream.
  let getUserMedia = () => {  
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })   //jo video/audio ka current state h after on or off of the video/audio
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((err) => console.log(err));
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (err) {
        console.log(err)
      }
    }
  };


  //used to setup local stream whenever there is a change
  // if we turn off audio or video from our side then turn off video or audio for all the connected users in room
  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;  //if our id then we do need to do anything

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {

        console.log("we change the user's new offer to: ", description);

        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ "sdp": connections[id].localDescription })
            );
          })
          .catch((err) => console.log(err));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);  
          setAudio(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ "sdp": connections[id].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        })
    );
  };

  let getDislayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          getUserMedia();
        })
    );
  };

  //handles incoming signaling messages  (fromId - who initiated the call)
  let gotMessageFromServer = (fromId, message) => {


    var signal = JSON.parse(message);  //message is - offer/answer or ice candidates

    // fromId is id2 in connectToSocketServer function
    if (fromId !== socketIdRef.current) {  //agr ye m nhi hoon || checking message is from another user

      if (signal.sdp) {  //checks if it is offer or answer
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          "sdp": connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((err) => console.log(err));
                })
                .catch((err) => console.log(err));
            }
          })
          .catch((err) => console.log(err));
      }

      //initially this will only run because it is the first step
      //if ice candidates then we add this to our socket means the other peer now can locate us
      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((err) => console.log(err));
      }
    }
  };  


  let connectToSocketServer = () => {

    //1. Setup a socket connection to the signaling server.
    //2. Join the call and notify the server.
    //3. Manage WebRTC peer connections for each participant.
    //4. Exchange signaling messages (ICE candidates and SDP offers/answers) between peers.

    socketRef.current = io.connect(server_url, { secure: false });

    //we are just listening here 
    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {

      socketRef.current.emit("join-call", window.location.href);

      socketIdRef.current = socketRef.current.id;  //socketIdRef.current represents current user
 
      //on chat messages
      socketRef.current.on("chat-message", addMessage);

      //on user left
      socketRef.current.on("user-left", (id) => {
        setVideos((prevVideos) => prevVideos.filter((video) => video.socketId !== id));
      });

      // userJoinedId-> kon join hua h .... clients-> kitne log h room m
      socketRef.current.on("user-joined", (userJoinedId, clients) => {
        clients.forEach((socketListId) => {
          
          //creating connections for each peer
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );

          // Wait for their ice candidate
          connections[socketListId].onicecandidate = function (event) {

            //checking if it has ice candidate is there or not bcoz sometimes it is not present
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          // Wait for their video stream 
          connections[socketListId].onaddstream = (event) => {

            console.log("BEFORE how many are connected: ", videoRef.current);

            //if already video exists then update it
            let videoExists = videoRef.current.find(  
              (video) => video.socketId === socketListId
            );

            if (videoExists) {
              console.log("FOUND EXISTING VIDEO!!");

              // Update the stream of the existing video
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } 

            //if not exists then create a new video of that user
            else {
              console.log("CREATING NEW VIDEO FOR THE USER");
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          // Add the local video stream to every user -- broadcasting
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        //  Checks if the user who joined (userJoinedId) is the current user (socketIdRef.current)
        if (userJoinedId === socketIdRef.current) {

          // creating offer letter
          for (let id in connections) {  
            if (id === socketIdRef.current) continue;    //agr ye m hoon to continue karo

            try {
              connections[id].addStream(window.localStream);
            } catch (e) {
              console.log(e);
            }

            connections[id].createOffer().then((description) => {

              //does this is the initiation of the call or not chect it?
              console.log("creating an offer for the first time: ", description);

              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,  // kis id ne offer create kiya h
                    JSON.stringify({ "sdp": connections[id].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };


  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let handleVideo = () => {
    setVideo(!video);
  };
  
  let handleAudio = () => {
    setAudio(!audio);
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);

  let handleScreen = () => {
    setScreen(!screen);
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}
    window.location.href = "/home";
  };

  let openChat = () => {
    setModal(true);
    setNewMessages(0);
  };
  let closeChat = () => {
    setModal(false);
  };
  let handleMessage = (e) => {
    setMessage(e.target.value);
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);

    if (socketIdSender !== socketIdRef.current) {  //m hoon to mujhe mere notification thodi n dekhinge, baki sb ko notification dikhao ki kitne message aye h 
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let sendMessage = () => {
    if(socketRef.current){
      try{
        socketRef.current.emit("chat-message", message, username);
        setMessage("");
      } catch(err){
        console.error("Failed to send message: ", err)
      }
    }
  };

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };



  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]); // Trigger when messages update  






  return (
    <div>
      {askForUsername === true ? (

        <div className="lobby">
          <div className="lobbyContainer">


            <div>
              <video ref={localVideoref} autoPlay muted className="lobbyVideo"></video>
            </div>

            <div className="details">
              <h2 className="lobbyHeading">Enter into Lobby </h2>
              <TextField
                className="textField"
                id="outlined-basic"
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
              />
              <Button variant="contained" onClick={connect} style={{marginTop: "10px"}}>
                Connect
              </Button>
            </div>
            
          </div>
        </div>
      ) : (
        <div className="meetVideoContainer">
          
          {showModal ? (
            <div className="chatRoom">
              <div className="chatContainer">
                <h2 style={{padding: "5px", color: "#000000c5"}}>In-call messages</h2>

                <div className="chattingDisplay" ref={chatContainerRef}>
                  {messages.length !== 0 ? (
                    messages.map((item, index) => {
                      console.log(messages);
                      return (
                        <div key={index}>
                          <p style={{ fontWeight: "bold" }} className="inputText">{item.sender}</p>
                          <p>{item.data}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p>No Messages Yet</p>
                  )}
                </div>

                <div className="chattingArea">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    id="outlined-basic"
                    variant="outlined"
                    placeholder="Message"
                    className="custom-textfield"
                    autocomplete="off"
                  />
                  <button variant="contained" onClick={sendMessage} className="custom-button" disabled={message.trim().length === 0 ? true : false}>
                    <SendIcon/>
                  </button>
                </div>
              </div>
            </div>

            
          ) : (
            <></>
          )} 

          <video
            className="meetUserVideo"
            ref={localVideoref}
            autoPlay
            muted
          ></video>

          <div className="conferenceView">
            {videos.map((video) => (
              <div key={video.socketId} className="vidDiv">
                <video
                className="video"
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                ></video>
              </div>
            ))}
          </div>

          <div className="buttonContainers">
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <StopScreenShareIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}

            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton
                onClick={() => setModal(!showModal)}
                style={{ color: "white" }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

        </div>
      )}
    </div>
  );
}


export default WithAuth(VideoMeet);