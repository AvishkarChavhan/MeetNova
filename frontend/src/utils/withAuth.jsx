import { useEffect } from "react";
import { useNavigate } from "react-router-dom"

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const router = useNavigate();

        const isAuthenticated = () => {
            if (sessionStorage.getItem("token")) { // ← was localStorage
                return true;
            }
            return false;
        }

        useEffect(() => {
            if (!isAuthenticated()) {
                router("/auth")
            }
        }, [router]) // ← added router to dependency array, fixes the eslint warning

        return <WrappedComponent {...props} />
    }

    return AuthComponent;
}

export default withAuth;