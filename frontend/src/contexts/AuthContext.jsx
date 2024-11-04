import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import httpStatus from "http-status";
import axios from "axios";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: "http://localhost:8000/api/v1/users",
});

export const AuthProvider = ({ children }) => {
  const authContext = useContext(AuthContext);

  const [userData, setUserData] = useState(authContext);

  const navigate = useNavigate();

  const handleRegister = async (name, username, password) => {
    try {
      let request = await client.post("/register", {
        name: name,
        username: username,
        password: password,
      }, {withCredentials: true});

      if (request.status === httpStatus.CREATED) {
        return request.data.message;
      }  else{

      }
    } catch (error) {
      throw error;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      let request = await client.post("/login", {
        username: username,
        password: password,
      }, {withCredentials: true});

      
      if(request.status === httpStatus.OK){
        const {message, success} = request.data;
        if(success){
          console.log("Login successful:", message);
          setTimeout(() => {
            navigate("/home")
          }, 1000)
          return message;
        } else{
          console.error("Login failed:", message);
          return message;
        }

      }
    } catch (error) {
      throw error;
    }
  };

  const getUserHistory = async () => {
    try {
      let request = await client.get("/get_all_activity", {
        params: {
          token: localStorage.getItem("token"),
        },
      });
      return request.data;
    } catch (err) {
      throw err;
    }
  };

  const addToHistory = async (meetingCode) => {
    try {
      let request = await client.post("/add_to_activity", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode,
      });
      return request;
    } catch (e) {
      throw e;
    }
  };

  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
    getUserHistory,
    addToHistory,
  };   

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
