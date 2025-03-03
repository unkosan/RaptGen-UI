/**
 * Parse CSV data for initial dataset
 * Extracts headers, random regions, sequence IDs, and values
 *
 * @param text CSV text content
 * @returns Parsed CSV data
 */
export const parseCsv = (text: string) => {
  const lines = text.split(/\r\n|\n|\r/);
  let headers = lines[0].split(",");

  const randomRegionIndex = headers.indexOf("random_region");
  if (randomRegionIndex === -1) {
    alert("random_region field is not found");
    throw new Error("random_region field is not found");
  }
  const seqIdIndex = headers.indexOf("seq_id");
  if (seqIdIndex === -1) {
    alert("seq_id field is not found");
    throw new Error("seq_id field is not found");
  }

  const validColumnsLength = headers.filter((header: string) => {
    return (
      header !== "random_region" &&
      header !== "seq_id" &&
      header !== "" &&
      header !== "coord_x" &&
      header !== "coord_y"
    );
  }).length;
  if (validColumnsLength === 0) {
    alert("No valid columns found");
    throw new Error("No valid columns found");
  }

  let sequenceIndex: number[] = [];
  let column: string[] = [];
  let value: number[] = [];
  let randomRegion: string[] = [];
  let id: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const data = lines[i].split(",");
    randomRegion.push(data[randomRegionIndex].trim());
    id.push(data[seqIdIndex].trim());

    for (let j = 0; j < headers.length; j++) {
      if (j === randomRegionIndex) continue;
      if (j === seqIdIndex) continue;

      sequenceIndex.push(i - 1);
      column.push(headers[j]);
      value.push(Number(data[j]));
    }
  }

  headers.splice(randomRegionIndex, 1);
  headers.splice(seqIdIndex, 1);

  return {
    columnNames: headers,
    id,
    randomRegion,
    sequenceIndex,
    column,
    value,
  };
};
