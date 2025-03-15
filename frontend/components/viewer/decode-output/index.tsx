import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import {
  Accordion,
  Button,
  Card,
  Form,
  Image,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { PlusLg } from "react-bootstrap-icons";

// Custom hooks
import { useBlockTime } from "./hooks/use-block-time";
import { useVaeParameters } from "./hooks/use-vae-parameters";
import { useWeblogoImage } from "./hooks/use-weblogo-image";
import { useSecondaryStructureImage } from "./hooks/use-secondary-structure-image";
import { useDecodedPointActions } from "./hooks/use-decoded-point-actions";
import { useSequenceDecoder } from "./hooks/use-sequence-decoder";

/**
 * DecoderOutput Component
 *
 * Displays the decoded sequence for a selected grid point and provides
 * visualization options like Weblogo and Secondary Structure.
 */
const DecoderOutput: React.FC = () => {
  // Redux state selectors
  const gridPoint = useSelector(
    (state: RootState) => state.interactionData.decodeGrid
  );
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );
  const vaeId = useSelector((state: RootState) => state.sessionConfig.vaeId);
  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );

  // Time-based locking mechanism to prevent rapid API calls
  const { lock, setLock } = useBlockTime(1000);

  // Get VAE adapter sequences
  const { forward, reverse } = useVaeParameters(vaeId);

  // Fetch the decoded sequence for the current grid point
  const { isLoading: isDecoding, sequence } = useSequenceDecoder(
    gridPoint,
    sessionId,
    lock
  );

  // Fetch visualization data with integrated toggle functionality
  const { weblogoBase64, showWeblogo, toggleWeblogo } = useWeblogoImage(
    sessionId,
    gridPoint,
    lock
  );

  const {
    secondaryStructureBase64,
    showSecondaryStructure,
    toggleSecondaryStructure,
  } = useSecondaryStructureImage(gridPoint, forward, reverse, sequence, lock);

  // Actions for adding decoded points to the table
  const { isLoading: isAdding, handleAdd } = useDecodedPointActions(
    gridPoint,
    sequence,
    decodeData
  );

  // Set lock when grid point changes to prevent rapid API calls
  useEffect(() => {
    setLock();
  }, [gridPoint, setLock]);

  // Determine if the add button should be disabled
  const isAddButtonDisabled = sequence === "" || isDecoding || isAdding;

  // Render add button content based on loading state
  const renderAddButtonContent = () => {
    if (isDecoding || isAdding) {
      return <Spinner animation="border" size="sm" />;
    }
    return (
      <div className="d-flex align-items-center">
        <PlusLg />
      </div>
    );
  };

  return (
    <Card className="mb-3">
      <Card.Header>Point Decoder Output</Card.Header>
      <Card.Body>
        {/* Sequence display with add button */}
        <InputGroup className="mb-3">
          <Form.Control value={sequence} readOnly />
          <Button
            disabled={isAddButtonDisabled}
            onClick={handleAdd}
            title="Add to decoded points"
          >
            {renderAddButtonContent()}
          </Button>
        </InputGroup>

        {/* Weblogo visualization */}
        <Accordion className="mb-3">
          <Accordion.Item eventKey="0">
            <Accordion.Header onClick={toggleWeblogo}>Weblogo</Accordion.Header>
            <Accordion.Body>
              <Image src={`data:image/png;base64, ${weblogoBase64}`} fluid />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        {/* Secondary structure visualization */}
        <Accordion>
          <Accordion.Item eventKey="0">
            <Accordion.Header onClick={toggleSecondaryStructure}>
              Secondary Structure
            </Accordion.Header>
            <Accordion.Body>
              <Image
                src={`data:image/png;base64, ${secondaryStructureBase64}`}
                fluid
              />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card.Body>
    </Card>
  );
};

export default DecoderOutput;
