import React, { useContext, useState, useEffect } from "react";
import "../App.css";
import { IconButton, Button, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {useCookies} from "react-cookie";
import axios from "axios";


function Home() {
  let navigate = useNavigate();
  let location = useLocation(); 
  const [cookies, setCookies, removeCookies] = useCookies(["token"]);
  const [meetingCode, setMeetingCode] = useState("");

  const { addToHistory } = useContext(AuthContext);

  let handleJoinVideoCall = async () => {
    await addToHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  const verifyToken = async() => {
    try {
      const response = await axios.post("http://localhost:8000/api/v1/users/verifyToken", {token: cookies.token});

      if(response.data.valid){
        return true;
      } else{
        handleLogout();
        return false;
      }
    } catch (error) {
      console.error("Token validation failed", error)
      handleLogout();
      return false;
    }
  }

  const handleLogout = () => {
    removeCookies("token", {path: "/"});
    // setAuth(false)
    navigate("/auth");
  };

  //checks token validity only on page load
  // useEffect(() => {
  //   verifyToken();
  // }, []);

  // useEffect(() => {
  //   const checkSession = async() => {
  //     const isValid = await verifyToken();
  //     if(!isValid){
  //       handleLogout();
  //     }
  //   };

  //   checkSession();
  // }, [location]);


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
              <TextField
                onChange={(e) => setMeetingCode(e.target.value)}
                id="outlined-basic"
                label="Meeting Code"
                variant="outlined"
              />
              <Button onClick={handleJoinVideoCall} variant="contained">
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

export default Home;
