import { Navigate } from "react-router-dom";

const NotFoundLayout = ({ element }) => {
    const token = localStorage.getItem("token");
    return <>{
        token ? element : <Navigate to="/login" />
    }</>;
};

export default NotFoundLayout;
