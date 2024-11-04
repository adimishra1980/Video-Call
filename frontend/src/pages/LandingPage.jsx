import React from "react";
import "../App.css";
import {Link} from "react-router-dom"
import { useNavigate } from "react-router-dom";

function LandingPage() {

  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/auth");
  }
  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <h2>Hangout</h2>
        </div>
        <div className="navList">
          <p onClick={() => navigate("/someRandom")}>Join as guest</p>
          <p onClick={() => navigate("/auth")}>Register</p>
          <div role="button"  onClick={() => navigate("/auth")}>
            <p>Login</p>
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            <span className="gradient-text unqFont">Connect</span> <span className="with">with</span> Your <span className="with">Loved</span> <span className="unqFont">Ones</span>
          </h1>

          {/* <p className="para">Virtual Vibe Connect: Link Up, Chat Out!</p> */}

          <div className="image-div"> 
            <img className="portrait-image img1" src="https://images.unsplash.com/photo-1633113214698-485cdb2f56fd?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" />
            <img className="portrait-image img2" src="https://images.unsplash.com/photo-1633113215883-a43e36bc6178?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" />
          </div>
        </div>

        <div role="button" className="signup-div" onClick={handleClick}>
            <Link to={"/auth"}>Get Started</Link>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
