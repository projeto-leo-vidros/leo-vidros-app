const mojibakePattern = /Ã|â€|Â|�/;

const repairString = (value) => {
  if (typeof value !== "string" || !mojibakePattern.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff);
    const repaired = new TextDecoder("utf-8").decode(bytes);

    if (mojibakePattern.test(repaired) && repaired.length >= value.length) {
      return value;
    }

    return repaired;
  } catch {
    return value;
  }
};

const repairValue = (value, seen = new WeakMap()) => {
  if (typeof value === "string") {
    return repairString(value);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value);
  }

  if (Array.isArray(value)) {
    const repairedArray = [];
    seen.set(value, repairedArray);

    value.forEach((item) => {
      repairedArray.push(repairValue(item, seen));
    });

    return repairedArray;
  }

  const repairedObject = {};
  seen.set(value, repairedObject);

  Object.entries(value).forEach(([key, item]) => {
    repairedObject[key] = repairValue(item, seen);
  });

  return repairedObject;
};

export const repairEncoding = (value) => repairValue(value);