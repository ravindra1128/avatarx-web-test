import { shenaiEvents } from "../../../lib/constants";

export const getShenaiEvents = ({instance, navigate}) => (event) => {
  const isLoggedIn = localStorage.getItem("token");
  // Handle finish button click
  if (event === shenaiEvents.USER_FLOW_FINISHED) {
    if (instance) {
      instance.destroyRuntime();
    }
    if (isLoggedIn) {
      navigate("/profile");
    } else {
      navigate("/demos");
    }
  }
};