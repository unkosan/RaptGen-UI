import React from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';

const SidebarVaeHome: React.FC = () => {

    type FastaParserResult = {
        fasta: {
            ids: string[],
            seqs: string[],
        } | null,
        invalidCount: number,
    }

    const parser = (text: string, type: 'fasta' | 'fastq'): FastaParserResult => {
        const allCount = text.match(/^>/gm)?.length ?? 0;
        let regex;
        if (type === 'fasta') {
            regex = /^>\s*(\S+)[\n\r]+([ACGTUacgtu\n\r]+)$/gm;
        } else {
            regex = /^@\s*(\S+)[\n\r]+([ACGTUacgtu\n\r]+)[\n\r]+\+\s*\S*[\n\r]+([!-~\n\r]+)$/gm;
        }
        let match: RegExpExecArray | null;
        let matchCount = 0;
        let entriesId = [];
        let entriesSeq = [];
        while (match = regex.exec(text)) {
            matchCount += 1;
            const id = match[1]
            const seq = match[2].replace(/[\n\r]/g, "").toUpperCase().replace(/T/g, "U");
            entriesId.push(id);
            entriesSeq.push(seq);
        }
        if (matchCount === 0) {
            return {
                fasta: null,
                invalidCount: 0,
            }
        } else {
            return {
                fasta: {
                    ids: entriesId,
                    seqs: entriesSeq,
                },
                invalidCount: allCount - matchCount,
            }
        }
    }

    const handleSelexFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {


    return (
        <>
            <legend>Upload File</legend>
            <Form>
                <Form.Group>
                    <Form.Label htmlFor="selex-file">SELEX File</Form.Label>
                    <Form.Control type="file" id="selex-file" />
                </Form.Group>
                <Form.Group>
                    <Form.Label htmlFor="vae-file">VAE File</Form.Label>
                    <Form.Control type="file" id="vae-file" />
                </Form.Group>
            </Form>

            <legend>Setup Selex Params</legend>
            <Form>
                <Form.Group>
                    <Form.Label htmlFor='model-name'>Model name</Form.Label>
                    <Form.Control type="text" id="model-name" />
                    <Form.Control.Feedback type="invalid">Invalid name</Form.Control.Feedback>
                </Form.Group>
                <Form.Group>
                    <Form.Label htmlFor='target-length'>Target length</Form.Label>
                    <InputGroup hasValidation>
                        <Form.Control type="number" id="target-length" />
                        <Button variant="outline-secondary">Auto</Button>
                        <Form.Control.Feedback type="invalid">Invalid value</Form.Control.Feedback>
                    </InputGroup>
                </Form.Group>
                <Form.Group>
                    <Form.Label htmlFor='forward-adapter'>Forward adapter</Form.Label>
                    <InputGroup hasValidation>
                        <Form.Control type="text" id="forward-adapter" />
                        <Button variant="outline-secondary">Auto</Button>
                        <Form.Control.Feedback type="invalid">Invalid adapter</Form.Control.Feedback>
                    </InputGroup>
                </Form.Group>
                <Form.Group>
                    <Form.Label htmlFor='reverse-adapter'>Reverse adapter</Form.Label>
                    <InputGroup hasValidation>
                        <Form.Control type="text" id="reverse-adapter" />
                        <Button variant="outline-secondary">Auto</Button>
                        <Form.Control.Feedback type="invalid">Invalid adapter</Form.Control.Feedback>
                    </InputGroup>
                </Form.Group>
                
                {/* Encode Button */}
                <Button>
                    Encode
                </Button>
            </Form>
        </>
    )
}