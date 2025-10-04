import { Navigate, useLocation } from "react-router-dom";
import { hasValidManagerSession } from "@/utils/session";

type RequireManagerAuthProps = {
  children: React.ReactElement;
};

const RequireManagerAuth = ({ children }: RequireManagerAuthProps) => {
  const location = useLocation();
  if (!hasValidManagerSession()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return children;
};

export default RequireManagerAuth;

