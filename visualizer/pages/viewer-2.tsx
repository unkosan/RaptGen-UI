import "bootswatch/dist/cosmo/bootstrap.min.css";
import { NextPage } from "next";
import { Provider } from "react-redux";

const PageRoot: NextPage = () => {
  return (
    <Provider store={store}>
      <Home />
    </Provider>
  );
};
