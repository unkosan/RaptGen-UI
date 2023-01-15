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
    Table,
} from "react-bootstrap";

import dynamic from 'next/dynamic';
import { useState, useEffect, SetStateAction, Dispatch } from "react";
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

async function encode (seq: string[], session_ID: number) {
    const res = await fetch("http://localhost:8000/dev/sample/encode", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            seq: seq,
            session_ID: session_ID,
        }),
    });
    const data: {coord_x: number[], coord_y: number[]} = await res.json();
    return data
}


const LatentGraph = () => {
    const layout: Partial<Layout> = {
        height: 800,
        title: "plot",
        plot_bgcolor: "#EDEDED",
        xaxis: {
            color: '#FFFFFF',
            tickfont: {
                color: '#000000'
            },
            range: [-3.5, 3.5],
            gridcolor: "#FFFFFF",
        },
        yaxis: {
            color: '#FFFFFF',
            tickfont: {
                color: '#000000'
            },
            range: [-3.5, 3.5],
            gridcolor: "#FFFFFF",
        },
        legend: {
            yanchor: "top",
            y: 1,
            x: 0,
            bgcolor: "rgba(255,255,255,0.8)",
        },
        hoverlabel: {
            font: {
                family: "Courier New"
            },
        },
        clickmode: 'event+select',
    }

    const [ selexData, setSelexData ] = useState<Partial<PlotData>>({type: "scatter", x: [], y: [], mode: "markers"})
    const [ measuredData, setMeasuredData ] = useState<Partial<PlotData>[]>([])
    const [ inputData, setInputData ] = useState<Partial<PlotData>>({type: "scatter", x: [], y: [], mode: "markers"})

    const forwardAdapter = "GGGACCGAGTGTTCAGC"
    const reverseAdapter = "GAGCTTGCACGTCGAG"

    interface SELEXData {
        Sequence: string[];
        Random_Region: string[];
        Duplicates: number[];
        coord_x: number[];
        coord_y: number[];
    }

    useEffect(() => {
        const fetchSelexData = async () => {
            const res = await fetch("http://localhost:8000/dev/sample/selex");
            const data: SELEXData = await res.json();
            const selexData: Partial<PlotData> = {
                name: 'SELEX',
                showlegend: false,
                type: "scatter",
                x: data.coord_x,
                y: data.coord_y,
                mode: "markers",
                marker: {
                    size: data.Duplicates.map((d: number) => Math.max(2, Math.sqrt(d))),
                    color: 'silver',
                    line: {
                        color: 'silver',
                    }
                },
                customdata: data.Random_Region.map((seq: string, i: number) => [
                    seq, // Sequence
                    data.Duplicates[i], // Duplicates
                ]),
                hovertemplate: 
                    "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>"
                    + "<b>Seq</b>: %{customdata[0]}<br>"
                    + "<b>Duplicates</b>: %{customdata[1]}",
            }
            setSelexData(selexData);
        }

        interface MeasuredData {
            ID: string[];
            Sequence: string[];
        }

        type Coords = {
            coord_x: number[];
            coord_y: number[];
        }

        const fetchMeasuredData = async () => {
            const resData = await fetch("http://localhost:8000/dev/sample/measured");
            const data: [{hue: string, data: MeasuredData}] = await resData.json();
            const measuredData = await Promise.all(data.map(async (elem, index) => {
                const hue = elem.hue;
                const mask = elem.data.Sequence.map((seq) => 
                    seq.startsWith(forwardAdapter) 
                    && seq.endsWith(reverseAdapter)
                    && seq.length >= forwardAdapter.length + reverseAdapter.length + 1
                );
                const sequences = elem.data.Sequence.filter((seq, i) => mask[i]);
                const randomRegions = sequences.map((seq) => 
                    seq.slice(forwardAdapter.length + 1, -reverseAdapter.length - 1)
                );
                const ID = elem.data.ID.filter((id, i) => mask[i]);
                const resCoord = await fetch("http://localhost:8000/dev/sample/encode", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        seq: randomRegions,
                        session_ID: 42,
                    }),
                });
                const coord: Coords = await resCoord.json();
                const measuredData: Partial<PlotData> = {
                    showlegend: true,
                    type: "scatter",
                    x: coord.coord_x,
                    y: coord.coord_y,
                    mode: "markers",
                    marker: {
                        size: 5,
                        color: ["#6495ed", "#ffa500", "#ffff00", "#800080", "#ff0000"][index % 5],
                    },
                    name: hue,
                    customdata: ID.map((id, i) => [
                        id, // ID
                        randomRegions[i], // Sequence
                    ]),
                    hovertemplate: 
                        "<b>%{customdata[0]}</b><br>"
                        + "<b>Coord:</b> (%{x:.4f}, %{y:.4f})<br>"
                        + "<b>Seq:</b> %{customdata[1]}",
                }
                return measuredData
            }))
            setMeasuredData(measuredData);
        }

        const fetchInputData = async() => {
            const data = ["GGGACCGAGTGTTCAGC", "GAGCTTGCACGTCGAG"];
            const res = await fetch("http://localhost:8000/dev/sample/encode", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    seq: data,
                    session_ID: 42,
                })
            });
            const coord: Coords = await res.json();
            const inputData: Partial<PlotData> = {
                showlegend: true,
                type: "scatter",
                x: coord.coord_x,
                y: coord.coord_y,
                mode: "markers",
                marker: {
                    size: 5,
                    color: "#90ee90"
                },
                name: "Input Data",
                customdata: data,
                hovertemplate: 
                    "<b>Input Data</b><br>"
                    + "<b>Coord:</b> (%{x:.4f}, %{y:.4f})<br>"
                    + "<b>Seq:</b> %{customdata[0]}",
            };
            setInputData(inputData);
        }

        fetchSelexData()
        fetchMeasuredData()
        fetchInputData()
    }, [])

    return (
        <Plot data={[selexData, ...measuredData, inputData]} layout={layout} useResizeHandler={true} style={{width: "100%", height: "100%"}}/>
    )
}

// const sequenceListMutex = new <Mutex></Mutex>();

const SideBar = () => {
    
    type FastaEntry = {
        id: string;
        seq: string;
    }

    type EncodeSequenceEntry = {
        key: string;
        id: string;
        seq: string;
        coord_x: number;
        coord_y: number;
        show: boolean;
        from: 'fasta' | 'manual';
        fasta_file: string | null;
    }

    const [ minCount, setMinCount ] = useState<number>(5);
    const [ minCountValid, setMinCountValid ] = useState<boolean>(true);

    const [ encodeSingleSeq, setEncodeSeq ] = useState<string>("");
    const [ encodeSingleSeqValid, setEncodeSeqValid ] = useState<boolean>(true);
    const [ encodeSingleSeqCount, setEncodeSingleSeqCount ] = useState<number>(0);

    const [ encodeFasta, setEncodeFasta ] = useState<FastaEntry[]>([]);
    const [ encodeFastaValid, setEncodeFastaValid ] = useState<boolean>(true);
    const [ encodeFastaFeedback, setEncodeFastaFeedback ] = useState<string>("");

    const [ encodeSeqList, setEncodeSeqList ] = useState<EncodeSequenceEntry[]>([]);
    const [ encodeSeqListCount, setEncodeSeqListCount ] = useState<number>(0);

    const [ nameVAE, setNameVAE ] = useState<string>("");
    const [ nameGMM, setNameGMM ] = useState<string>("");
    const [ nameMeasured, setNameMeasured ] = useState<string>("");

    const [ nameListVAE, setNameListVAE ] = useState<string[]>([""]);
    const [ nameListGMM, setNameListGMM ] = useState<string[]>([""]);
    const [ nameListMeasured, setNameListMeasured ] = useState<string[]>([""]);

    useEffect(() => {
        const fetchNameList = async () => {
            const res = await fetch("http://localhost:8000/dev/sample/VAEmodels");
            const data = await res.json();
            setNameListVAE(data.entries);
            if (data.entries.length > 0) {
                setNameVAE(data.entries[0]);
            }
        }
        fetchNameList();
    }, []);

    useEffect(() => {
        const fetchNameList = async () => {
            const res = await fetch("http://localhost:8000/dev/sample/measuredData");
            const data = await res.json();
            setNameListMeasured(data.entries);
            if (data.entries.length > 0) {
                setNameMeasured(data.entries[0]);
            }
        }
        fetchNameList();
    }, []);

    useEffect (() => {
        if (nameVAE === "") {
            setNameListGMM([""]);
            return;
        }
        const fetchNameList = async () => {
            const res = await fetch(
                "http://localhost:8000/dev/sample/GMMmodels?"
                + new URLSearchParams({
                    "VAE_name": nameVAE,
                })
            );
            const data = await res.json();
            setNameListGMM(data.entries);
        }
        fetchNameList();
    }, [nameVAE]);

    const handleMinCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.currentTarget.value);

        const minCount = value;
        setMinCount(minCount);

        const minCountValid = !isNaN(value) && value >= 1;
        setMinCountValid(minCountValid);
    }

    const handleEncodeSeqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value;

        // check if the sequence consists of only ACGTU (case insensitive, 0 length is allowed)
        const encodeSeqValid = /^[ACGTU]*$/i.test(value);
        setEncodeSeqValid(encodeSeqValid);

        if (encodeSeqValid) {
            // change the sequence to uppercase and T to U
            const encodeSeq = value.toUpperCase().replace(/T/g, "U");
            setEncodeSeq(encodeSeq);
        } else {
            setEncodeSeq(value);
        }
    }

    const handleEncodeFastaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const handleFunc = async () => {
            const files = e.currentTarget.files;
            if (files === null) {
                setEncodeFasta([]);
                setEncodeFastaValid(true);
                setEncodeFastaFeedback("");
                return;
            }

            const file = files[0];
            const filename = file.name;
            if (!filename.endsWith(".fasta")) {
                setEncodeFasta([]);
                setEncodeFastaValid(false);
                setEncodeFastaFeedback("The file must be a FASTA file.");
                return;
            }

            const content = await file.text();

            const fastaRegex = /^>\s*(\S+)[\n\r]+([ACGTUacgtu\n\r]+)$/gm;
            
            let match: RegExpExecArray | null;
            let matchCount = 0;
            let fastaEntries: FastaEntry[] = [];
            while (match = fastaRegex.exec(content)) {
                matchCount++;
                const id = match[1];
                const seq = match[2].replace(/[\n\r]/g, "").toUpperCase().replace(/T/g, "U");
                fastaEntries.push({
                    id: id,
                    seq: seq,
                })
            }

            if (matchCount === 0) {
                setEncodeFasta([]);
                setEncodeFastaValid(false);
                setEncodeFastaFeedback("The file is invalid / does not contain any FASTA entries.");
                return;
            }

            // /dev/encode requires array which contains more than 0 entries
            // therefore matchCount (the number of valid FASTA entries) must be more than 0

            const fastaSeq = fastaEntries.map((entry) => entry.seq);

            const res = await fetch("http://localhost:8000/dev/sample/encode", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    seq: fastaSeq,
                    session_ID: 42,
                }),
            });
            const data = await res.json();
            const { coord_x, coord_y } = data;

            
            const entries: EncodeSequenceEntry[] = fastaEntries.map((entry, i) => {
                return {
                    key: String(encodeSeqListCount + i),
                    id: entry.id,
                    seq: entry.seq,
                    coord_x: coord_x[i],
                    coord_y: coord_y[i],
                    show: true,
                    from: "fasta",
                    fasta_file: filename,
                }
            });
            setEncodeSeqListCount(encodeSeqListCount + matchCount);

            const allCount = content.match(/^>/gm)?.length ?? 0;
            if (matchCount !== allCount) {
                setEncodeFastaFeedback(`Looks good. But the file contains ${allCount - matchCount} invalid FASTA entries.`);
            } else {
                setEncodeFastaFeedback("");
            }

            setEncodeFasta(fastaEntries);
            setEncodeFastaValid(true);
            setEncodeSeqList([
                ...encodeSeqList,
                ...entries,
            ]);
            return;
        };

        handleFunc();
    }

    const sequenceTable = () => {

        // const [ seqFilter, setSeqFilter ] = useState<string[]>([""]);

        type SequenceRecordProp = {
            handleEncodeSeqList: Dispatch<SetStateAction<EncodeSequenceEntry[]>>;
            encodeSeqList: EncodeSequenceEntry[];
            entry: EncodeSequenceEntry;
        }
            
        const SequenceRecord = (props: SequenceRecordProp) => {

            const [ isEditing, setIsEditing ] = useState<boolean>(false);
            const [ seqValue, setSeqValue ] = useState<string>(props.entry.seq);
            const [ seqValid, setSeqValid ] = useState<boolean>(true);
            
            const onShowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const newEncodeSeqList = [...props.encodeSeqList];
                const index = newEncodeSeqList.findIndex((entry) => entry.key === props.entry.key);
                newEncodeSeqList[index].show = e.currentTarget.checked;
                props.handleEncodeSeqList(newEncodeSeqList);
            }
            
            const onRemove = () => {
                const newEncodeSeqList = [...props.encodeSeqList];
                const index = newEncodeSeqList.findIndex((entry) => entry.key === props.entry.key);
                newEncodeSeqList.splice(index, 1);
                props.handleEncodeSeqList(newEncodeSeqList);
            }

            const onEdit = () => {
                setIsEditing(true);
            }

            const onEditCancel = () => {
                setSeqValue(props.entry.seq);
                setIsEditing(false);
            }

            const onEditSave = async () => {
                const newEncodeSeqList = [...props.encodeSeqList];
                const index = newEncodeSeqList.findIndex((entry) => entry.key === props.entry.key);

                const { coord_x, coord_y } = await encode([seqValue], 42);
                newEncodeSeqList[index].seq = seqValue;
                newEncodeSeqList[index].coord_x = coord_x[0];
                newEncodeSeqList[index].coord_y = coord_y[0];

                props.handleEncodeSeqList(newEncodeSeqList);
                setIsEditing(false);
            }

            const validateSeq = (seq: string) => {
                const regex = /^[ACGTUacgtu]+$/;
                return regex.test(seq);
            }

            const onSeqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                // uppercase and T to U
                const seq = e.currentTarget.value.toUpperCase().replace(/T/g, "U");
                setSeqValue(seq);
                setSeqValid(validateSeq(seq));
            }

            if (isEditing) {
                return (
                    <tr key={props.entry.key} >
                        <td><Form.Check type="checkbox" checked={props.entry.show} onChange={onShowChange} /></td>
                        <td>{props.entry.id}</td>
                        <td>
                            <Form.Control
                                type="text"
                                value={seqValue}
                                onChange={onSeqChange}
                                isInvalid={!seqValid}
                            />
                            <Form.Control.Feedback type="invalid">Invalid sequence</Form.Control.Feedback>
                        </td>
                        <td>
                            <Button variant="outline-secondary" onClick={onEditSave} disabled={!seqValid}>Save</Button>
                            <Button variant="outline-danger" onClick={onEditCancel}>Cancel</Button>
                        </td>
                    </tr>
                )
            } else {
                return (
                    <tr key={props.entry.key} >
                        <td><Form.Check type="checkbox" checked={props.entry.show} onChange={onShowChange} /></td>
                        <td>{props.entry.id}</td>
                        <td>{props.entry.seq}</td>
                        <td>
                            <Button variant="outline-secondary" onClick={onEdit}>Edit</Button>
                            <Button variant="outline-danger" onClick={onRemove}>Remove</Button>
                        </td>
                    </tr>
                )
            }
        }

        return (
            <>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Show</th>
                            <th>ID</th>
                            <th>Sequence</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {encodeSeqList.map((entry) => {
                            // if (seqFilter.includes(entry.id)) {
                            //     return <SequenceRecord key={entry.key} handleEncodeSeqList={setEncodeSeqList} encodeSeqList={encodeSeqList} entry={entry} />
                            // } else {
                            //     return null;
                            // }
                            return (
                                <SequenceRecord 
                                    key={entry.key} 
                                    handleEncodeSeqList={setEncodeSeqList} 
                                    encodeSeqList={encodeSeqList} 
                                    entry={entry} 
                                />
                            );
                        })}
                        {/* {encodeSeqList.map((entry, index) => (
                            <tr key={entry.id}>
                                <td><Form.Check type="checkbox" checked={entry.show} onChange={(e) => {
                                    const newEncodeSeqList = [...encodeSeqList];
                                    newEncodeSeqList[index].show = e.currentTarget.checked;
                                    setEncodeSeqList(newEncodeSeqList);} } /></td>
                                <td>{entry.id}</td>
                                <td>{entry.seq}</td>
                                <td><Button onClick={(e) => {
                                    const newEncodeSeqList = [...encodeSeqList];
                                    newEncodeSeqList.splice(index, 1);
                                    setEncodeSeqList(newEncodeSeqList);
                                }}>−</Button></td>
                            </tr>
                        ))} */}
                    </tbody>
                </Table>
            </>
        );
    }

    const handleSingleSeqButtonClick = () => {
        if (!encodeSingleSeqValid || encodeSingleSeq === "") {
            return null;
        }

        const handleFunc = async () => {
            const res = await fetch("http://localhost:8000/dev/sample/encode", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    seq: [encodeSingleSeq],
                    session_ID: 42,
                }),
            });
            const data = await res.json();
            const { coord_x, coord_y } = data;
            setEncodeSeqList([
                ...encodeSeqList,
                {
                    key: String(encodeSeqListCount),
                    id: `ManualInput_${encodeSingleSeqCount}`,
                    seq: encodeSingleSeq,
                    coord_x: coord_x[0],
                    coord_y: coord_y[0],
                    show: true,
                    from: "manual",
                    fasta_file: null,
                },
            ])
            setEncodeSeqListCount(encodeSeqListCount + 1)
            setEncodeSingleSeqCount(encodeSingleSeqCount + 1);
        };

        handleFunc();
    }
        
    return (
        <>
            <legend>Data</legend>
            <Form>
                <Form.Group className="mb-3">
                    <Form.Label htmlFor="modelNameVAE">Selected VAE Model</Form.Label>
                    <Form.Select id="modelNameVAE" value={nameVAE} onChange={(e) => setNameVAE(e.currentTarget.value)}>
                        {nameListVAE.map((name) => <option>{name}</option>)}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label htmlFor="modelNameGMM">Selected GMM Model</Form.Label>
                    <Form.Select id="modelNameGMM" value={nameGMM} onChange={(e) => setNameGMM(e.currentTarget.value)}>
                        {nameListGMM.map((name) => <option>{name}</option>)}
                    </Form.Select>
                    <Form.Check type="switch" id="plotSwitchGMM" defaultChecked={false} label="draw GMM circles" />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label htmlFor="measuredDataName">Selected measured value data</Form.Label>
                    <Form.Select id="measuredDataName">
                        {nameListMeasured.map((name) => <option>{name}</option>)}
                    </Form.Select>
                </Form.Group>
            </Form>
            
            <legend>Config</legend>
            <Form.Group as={Row} className="mb-3">
                <Form.Label column>Minimum count</Form.Label>
                <Col>
                    <Form.Control type="number" id="minCount" onChange={handleMinCountChange} value={minCount} isInvalid={!minCountValid}/>
                    <Form.Control.Feedback type="invalid">Please enter a positive integer.</Form.Control.Feedback>
                </Col>
            </Form.Group>
            
            <legend>Operation</legend>
            <Form.Group className="mb-3">
                <Form.Label>Encode Sequence</Form.Label>
                <InputGroup hasValidation>
                    <Form.Control id="newSeqInput" onChange={handleEncodeSeqChange} value={encodeSingleSeq} isInvalid={!encodeSingleSeqValid}/>
                    <Button 
                        id="newSeqButton" 
                        disabled={(encodeSingleSeq === "") || !encodeSingleSeqValid} 
                        onClick={handleSingleSeqButtonClick}>＋</Button>
                    <Form.Control.Feedback type="invalid">Please enter a valid sequence.</Form.Control.Feedback>
                </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Encode Fastafile</Form.Label>
                <Form.Control id="newSeqFile" type="file" onChange={handleEncodeFastaChange} isInvalid={!encodeFastaValid} isValid={(encodeFastaValid) && encodeFasta.length > 0}/>
                <Form.Control.Feedback type="invalid">{encodeFastaFeedback}</Form.Control.Feedback>
                <Form.Control.Feedback type="valid">{encodeFastaFeedback}</Form.Control.Feedback>
            </Form.Group>

            <Form.Label>Sequences</Form.Label>
            {sequenceTable()}

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