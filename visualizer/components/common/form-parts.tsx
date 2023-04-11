
// type Props = {
//     value: string
//     buttonLabel: string
//     onChange: (value: string) => void 
//     onButtonClick: () => void
// }

import { Form } from "react-bootstrap"


// const SequenceForm: React.FC<Props> = (props) => {
    
// }

type Props = {
  value: string
  onChange: (value: string) => void
  onChangeValid: (value: boolean) => void
  validator: (value: string) => boolean
}

const VaridatedTextForm: React.FC<Props> = (props) {
    return (
        <Form.Group className="mb-3">
            <InputGroup hasValidation>
            <Form.Control
                onChange={(e) => {
                    e.
                }} />

            
            </InputGroup>
        </Form.Group>
    )
}