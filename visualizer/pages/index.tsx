import "bootswatch/dist/cosmo/bootstrap.min.css";
import Head from "next/head";
import { NextPage } from "next";
import Navigator from "~/components/common/navigator";
import { Container, Row, Col, Card } from "react-bootstrap";
import Link from "next/link";
import Footer from "~/components/common/footer";

type CellProps = {
  title: string;
  content: string;
  url: string;
};

// link to the page
const Cell: React.FC<CellProps> = (props) => {
  return (
    <Link href={props.url} style={{ textDecoration: "none" }}>
      <Card>
        <Card.Body>
          <Card.Title>{props.title}</Card.Title>
          <Card.Text>{props.content}</Card.Text>
        </Card.Body>
      </Card>
    </Link>
  );
};

const Home: React.FC = () => {
  return (
    <div className="vh-100 d-flex flex-column">
      <Navigator currentPage="" />
      <main>
        <Container>
          <h1 style={{ marginTop: "1rem" }}>Home</h1>
          <hr />
          <Row className="my-3">
            <Col>
              <Cell
                title="Viewer"
                content="Operate on latent space of RaptGen VAE"
                url="/viewer"
              />
            </Col>
            <Col>
              <Cell
                title="VAE Trainer"
                content="Train a RaptGen model"
                url="/trainer"
              />
            </Col>
          </Row>
          <Row className="my-3">
            <Col>
              <Cell
                title="GMM Trainer"
                content="Run a GMM on the latent space"
                url="/gmm"
              />
            </Col>
            <Col>
              <Cell
                title="Bayesian Optimization"
                content="Optimize objective function using Bayesian Optimization"
                url="/bayesopt"
              />
            </Col>
          </Row>
          <Row className="my-3">
            <Col>
              {/* <Cell
                title="Upload"
                content="upload a trained RaptGen model or GMM model"
                url="/uploader"
              /> */}
            </Col>
            <Col></Col>
          </Row>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

const PageRoot: NextPage = () => {
  return (
    <>
      <Head>
        <title>RaptGen-UI</title>
        <meta name="description" content="Standalone web UI for RaptGen" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Home />
    </>
  );
};

export default PageRoot;
