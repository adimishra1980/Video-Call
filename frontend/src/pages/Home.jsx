import React, { useContext, useState, useEffect } from "react";
import "../App.css";
import { IconButton, Button, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {useCookies} from "react-cookie";
import axios from "axios";
import { nanoid } from 'nanoid';
import WithAuth from "../utils/withAuth";


function Home() {
  let navigate = useNavigate();

  const [cookies, setCookies, removeCookies] = useCookies(["token"]);
  const [meetingCode, setMeetingCode] = useState("");

  const { addToHistory } = useContext(AuthContext);

  const isValidNanoID = (value) => /^[a-zA-Z0-9_-]{18}$/.test(value);

  let handleJoinVideoCall = async () => {

    if(isValidNanoID(meetingCode)){
      await addToHistory(meetingCode);
      navigate(`/${meetingCode}`);
    }
  };

  const handleLogout = async() => {

    try {
      await axios.post("http://localhost:8000/api/v1/users/logout", {}, {withCredentials: true});
      removeCookies("token", {path: "/"});
      navigate("/auth");

    } catch (error) {
      console.error("Logout failed: ", error);
    }

    // removeCookies("token", {path: "/"});
    // navigate("/auth");
  };


  const handleMeetingCode = () => {
    setMeetingCode(nanoid(18))
  }
 

  return (
    <>
      <div className="navbar">
        <div style={{ display: "flex", alignItems: "center" }}>
    
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "30px", margin: "20px" }}>

          <Button
            variant="contained"
            onClick={() => navigate("/history")}
          >
            <RestoreIcon /> &nbsp;  History 
          </Button>
             
          <Button
            variant="contained"
            onClick={handleLogout}
          >
            Logout
          </Button>

          
        </div>
      </div>

      <div className="meetContainer">
        <div className="leftPanel">
          <div>
            <h2 style={{fontWeight: "600"}}>Providing Quality Video Call Just Like Me😭</h2> <br />
            <div style={{ display: "flex", gap: "15px" }}>

              <Button onClick={handleMeetingCode} variant="contained">
                New meeting
              </Button>
              <TextField
                onChange={(e) => setMeetingCode(e.target.value)}
                id="outlined-basic"
                label="Meeting Code"
                variant="outlined"
                value={meetingCode}
              />

              <Button onClick={handleJoinVideoCall} variant="text" disabled={!meetingCode ? true : false}>
                Join
              </Button>
              
            </div>
          </div>
        </div>

        <div className="rightPanel">
          <img srcSet="/logo3.png" alt="" />
        </div>
      </div>
    </>
  );
}

export default WithAuth(Home);
