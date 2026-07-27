import { Slide, ToastContainer } from "react-toastify";

const ToastApplier = () => {
  return (
    <ToastContainer
      position="top-center"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      stacked
      theme="light"
      transition={Slide}
    />
  );
};

export default ToastApplier;
