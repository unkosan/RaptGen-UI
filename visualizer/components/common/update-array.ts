function updateArray<T extends { key: number }>(
  command: "add" | "update" | "remove",
  collection: T[],
  value: T
): T[];

function updateArray<T extends { key: number }>(
  command: "add" | "update" | "remove",
  collection: T[],
  value: T[]
): T[];

function updateArray<T extends { key: number }>(
  command: "add" | "update" | "remove",
  collection: T[],
  value: T | T[]
) {
  let newValues: T[]; // for input array
  let newArray: T[] = [...collection]; // for whole array
  if (Array.isArray(value)) {
    newValues = value;
  } else {
    newValues = [value];
  }
  // switch is not recommended
  // because all cases share the variable names.
  if (command === "add") {
    const firstNewKey = collection[-1]?.key ?? 0;
    newValues.forEach((value, index) => {
      return {
        ...value,
        key: firstNewKey + index,
      };
    });
    newArray.concat(newValues);
  } else if (command === "update") {
    newValues.forEach((value) => {
      const targetKey = value.key;
      const targetIdx = newArray.findIndex((value) => value.key === targetKey);
      newArray[targetIdx] = value;
    });
  } else if (command === "remove") {
    newValues.forEach((value) => {
      const targetKey = value.key;
      const targetIdx = newArray.findIndex((value) => value.key === targetKey);
      newArray.splice(targetIdx, 1);
    });
  } else {
    throw Error;
  }
  return newArray;
}

export default updateArray;
