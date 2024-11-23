import axios from "axios"
import { useEffect, useState } from "react"
import {useNavigate} from "react-router-dom"
import {useCookies} from "react-cookie"; 


const WithAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const navigate = useNavigate()
        const [loading, setLoading] = useState(true);
        const [cookies, setCookies, removeCookies] = useCookies(["token"]);

        useEffect(() => {
            const checkAuthentication = async() => {
                try {
                    const response = await axios.post("http://localhost:8000/api/v1/users/verifyToken", {token: cookies.token}, { withCredentials: true });

                    if(response.data.valid){
                        setLoading(false);
                        return true;
                    }
                    else{
                        console.log(response.data.messages);
                        removeCookies("token", {path: "/"});
                        navigate("/auth");
                        return false;
                    }
                } catch (error) {
                    console.error("Token validation failed: ", error);
                    navigate("/auth");
                }
            }

            checkAuthentication();
        }, [navigate]);

        if(loading){
            return <div>Loading...</div>
        }

        return <WrappedComponent {...props} />
    }


    return AuthComponent
}

export default WithAuth