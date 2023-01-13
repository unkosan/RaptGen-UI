import Head from "next/head";
import { NextPage } from "next";
import 'bootswatch/dist/cosmo/bootstrap.min.css';
import { Layout, PlotData } from "plotly.js";

import { 
    Container, 
    Row,
    Col,
    Nav, 
    Navbar, 
    NavDropdown,
    Dropdown,
    Form,
    ToggleButton,
    FormGroup,
    InputGroup,
    Button,
} from "react-bootstrap";

import dynamic from 'next/dynamic';
import { useState, useEffect } from "react";
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const NavRaptGen = () => {
    return (
        <Navbar bg="primary" variant="dark">
            <Container>
                <Navbar.Brand>RaptGen Visualizer</Navbar.Brand>
                <Nav className="me-auto">
                    <Nav.Link>Viewer</Nav.Link>
                    <Nav.Link>Upload VAE</Nav.Link>
                    <Nav.Link>Upload GMM</Nav.Link>
                    <Nav.Link>Upload Measured Data</Nav.Link>
                    <Nav.Link>Remove Data</Nav.Link>
                </Nav>
            </Container>
        </Navbar>
    )
}

// type LatentGraphProps = {

// }

const LatentGraph = () => {
    const layout: Partial<Layout> = {
        height: 800,
        // width: 800,
        title: "plot",
        plot_bgcolor: "#EDEDED",
        xaxis: {
            range: [-3.5, 3.5]
        },
        yaxis: {
            range: [-3.5, 3.5],
            // scaleanchor: "x",
        },
    }
    
    const [ data, setData ]: [ Partial<PlotData>, ] = useState([{type: "scatter", x: [], y: [], mode: "markers"}])

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch("http://localhost:3000/api/hello");
            const data = await res.json();
            const plotData: Partial<PlotData> = {
                type: "scatter",
                x: data.coord_x,
                y: data.coord_y,
                mode: "markers",
                // marker: {
                //     size: data.Duplicates
                // },
            }
            console.log(plotData);
            setData([plotData]);
        }
        fetchData();
    }, [])

    return (
        <Plot data={data} layout={layout} useResizeHandler={true} style={{width: "100%", height: "100%"}}/>
    )
}

const SideBar = () => {
    const [ checked, setChecked ] = useState(false);

    return (
        <>
            <legend>Data</legend>
            <Form>
                <Form.Group className="mb-3">
                    <Form.Label htmlFor="modelNameVAE">Selected VAE Model</Form.Label>
                    <Form.Select id="modelNameVAE">
                        <option>a</option>
                        <option>b</option>
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label htmlFor="modelNameGMM">Selected GMM Model</Form.Label>
                    <Form.Select id="modelNameGMM">
                        <option>a</option>
                        <option>b</option>
                    </Form.Select>
                    <Form.Check type="switch" id="plotSwitchGMM" defaultChecked={false} label="draw GMM circles" />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label htmlFor="measuredDataName">Selected measured value data</Form.Label>
                    <Form.Select id="measuredDataName">
                        <option>a</option>
                        <option>b</option>
                    </Form.Select>
                </Form.Group>
            </Form>
            
            <legend>Config</legend>
            <Form.Group as={Row} className="mb-3">
                <Form.Label column>Minimum count</Form.Label>
                <Col>
                    <Form.Control type="number" id="minCount" defaultValue={5}/>
                </Col>
            </Form.Group>
            
            <legend>Operation</legend>
            <Form.Group className="mb-3">
                <Form.Label>Encode Sequence</Form.Label>
                <InputGroup>
                    <Form.Control id="newSeqInput" />
                    <Button id="newSeqButton">Encode</Button>
                </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Encode Fastafile</Form.Label>
                <Form.Control id="newSeqFile" type="file"/>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Download cluster</Form.Label>
                <InputGroup>
                    <Form.Select id="clusterName" defaultValue={"all"}>
                        <option>all</option>
                        <option>b</option>
                    </Form.Select>
                    <Button id="clusterDownloadButton">Download</Button>
                </InputGroup>
            </Form.Group>

            <legend>VAE model properties</legend>
            <legend>GMM model properties</legend>
        </>
    )
}

// const Footer = () => {
//     return (
//         <footer className="page-footer font-small blue pt-4">
//             <Container fluid={"true"} className="text-center text-md-left">
//                 <h5 className="text-uppercase">RaptGen Visualizer</h5>
//                 <p>placeholder</p>
//             </Container>
//         </footer>
//     )
// }

const Footer = () => {
    return (
        <footer className="page-footer font-small blue pt-4">
            <div className="container-fluid text-center text-md-left">
                <div className="row">
                    <div className="col-md-6 mt-md-0 mt-3">
                        <h5 className="text-uppercase">Footer Content</h5>
                        <p>Here you can use rows and columns to organize your footer content.</p>
                    </div>

                    <hr className="clearfix w-100 d-md-none pb-0"/>

                    <div className="col-md-3 mb-md-0 mb-3">
                        <h5 className="text-uppercase">Links</h5>
                        <ul className="list-unstyled">
                            <li><a href="#!">Link 1</a></li>
                            <li><a href="#!">Link 2</a></li>
                            <li><a href="#!">Link 3</a></li>
                            <li><a href="#!">Link 4</a></li>
                        </ul>
                    </div>

                    <div className="col-md-3 mb-md-0 mb-3">
                        <h5 className="text-uppercase">Links</h5>
                        <ul className="list-unstyled">
                            <li><a href="#!">Link 1</a></li>
                            <li><a href="#!">Link 2</a></li>
                            <li><a href="#!">Link 3</a></li>
                            <li><a href="#!">Link 4</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="footer-copyright text-center py-3">© 2020 Copyright:
                <a href="https://mdbootstrap.com/"> MDBootstrap.com</a>
            </div>

        </footer>
    )
}

const VisualizerPage: NextPage = () => {
    return (
      <>
        <Head>
          <title>RaptGen Visualizer</title>
          <meta name="description" content="Generated by create next app" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main>
          <NavRaptGen />
          <Container>
            <h1>Viewer</h1>
            <hr />
            <Row>
                <Col md={4}>
                    <SideBar />
                </Col>
                <Col>
                    <LatentGraph />
                    {/* <PointDetail />
                    <PointTable /> */}
                </Col>
            </Row>
          </Container>
          <Footer />
        </main>
      </>
    )
  }
  
  export default VisualizerPage