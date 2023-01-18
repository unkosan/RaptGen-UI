import { Navbar, Nav, Container } from 'react-bootstrap'


type Props = {
    current_page: 'viewer' 
        | 'upload_vae' 
        | 'upload_gmm' 
        | 'upload_measured_data' 
        | 'remove_data'
}

const NavRaptGen: React.FC<Props> = ({ current_page }) => {
    const pages = [ 'viewer', 'upload_vae', 'upload_gmm', 'upload_measured_data', 'remove_data' ];

    return (
        <Navbar bg="primary" variant="dark">
            <Container>
                <Navbar.Brand>RaptGen Visualizer</Navbar.Brand>
                <Nav className="me-auto">
                    { pages.map((page) => <Nav.Item >{page}</Nav.Item>) }
                </Nav>
            </Container>
        </Navbar>
    )
}

export default NavRaptGen