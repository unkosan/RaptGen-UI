import { Card } from "react-bootstrap";
import SideBarVAE from "./sidebar-vae/sidebar-vae";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { RootState } from "./redux/store";

const SideBar: React.FC = () => {
  const dispatch = useDispatch();
  const pseudoRoute = useSelector(
    (state: RootState) => state.uploadConfig.pseudoRoute
  );

  const handleClickVAE = () => {
    dispatch({
      type: "uploadConfig/setRoute",
      payload: "/vae/home",
    });
  };

  return (
    <>
      <div style={{ display: pseudoRoute === "/" ? "block" : "none" }}>
        <legend>Menu</legend>
        <Card onClick={handleClickVAE} style={{ cursor: "pointer" }}>
          <Card.Body>
            <Card.Title>Upload VAE</Card.Title>
            <Card.Text>
              You need a trained RaptGen model file and a SELEX file.
            </Card.Text>
          </Card.Body>
        </Card>
      </div>
      <div
        style={{ display: pseudoRoute.startsWith("/vae") ? "block" : "none" }}
      >
        <SideBarVAE />
      </div>
    </>
  );
};

export default SideBar;
