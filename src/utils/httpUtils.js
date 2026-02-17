import url from "node:url";

export function parseJSON(req, callback) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", () => {
    try {
      const data = body ? JSON.parse(body) : {};
      callback(null, data);
    } catch (error) {
      callback(error, null);
    }
  });
}

export function parseMultipart(req, callback) {
  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=([^;]+)/);

  if (!boundaryMatch) {
    callback(new Error("Boundary não encontrado no Content-Type"), null);
    return;
  }

  const boundary = boundaryMatch[1].trim();
  let body = Buffer.alloc(0);

  req.on("data", (chunk) => {
    body = Buffer.concat([body, chunk]);
  });

  req.on("end", () => {
    try {
      const result = parseMultipartBody(body, boundary);
      callback(null, result);
    } catch (error) {
      callback(error, null);
    }
  });
}

function parseMultipartBody(buffer, boundary) {
  const boundaryBuffer = Buffer.from("--" + boundary);
  const endBoundaryBuffer = Buffer.from("--" + boundary + "--");

  const parts = [];
  let start = buffer.indexOf(boundaryBuffer);

  while (start !== -1) {
    let end = buffer.indexOf(boundaryBuffer, start + boundaryBuffer.length);
    if (end === -1) {
      end = buffer.indexOf(endBoundaryBuffer, start + boundaryBuffer.length);
    }

    if (end === -1) break;

    const part = buffer.slice(start + boundaryBuffer.length, end);
    const parsedPart = parsePart(part);
    if (parsedPart) {
      parts.push(parsedPart);
    }

    start = buffer.indexOf(boundaryBuffer, end);
  }

  const filePart = parts.find((p) => p.filename);
  if (filePart) {
    return {
      file: {
        fieldname: filePart.name,
        originalname: filePart.filename,
        buffer: filePart.data,
        mimetype: filePart.contentType || "application/octet-stream",
      },
    };
  }

  return { fields: parts };
}

function parsePart(partBuffer) {
  const headerEnd = partBuffer.indexOf("\r\n\r\n");
  if (headerEnd === -1) return null;

  const headerBuffer = partBuffer.slice(0, headerEnd);
  const dataBuffer = partBuffer.slice(headerEnd + 4);

  let cleanData = dataBuffer;
  if (cleanData.slice(-2).toString() === "\r\n") {
    cleanData = cleanData.slice(0, -2);
  }

  const headerStr = headerBuffer.toString();
  const dispositionMatch = headerStr.match(
    /Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/i
  );
  const contentTypeMatch = headerStr.match(/Content-Type: (.+)/i);

  if (!dispositionMatch) return null;

  return {
    name: dispositionMatch[1],
    filename: dispositionMatch[2] || null,
    contentType: contentTypeMatch ? contentTypeMatch[1].trim() : null,
    data: cleanData,
  };
}

export function getQueryParams(reqUrl) {
  const parsedUrl = url.parse(reqUrl, true);
  return parsedUrl.query;
}

export function getPathname(reqUrl) {
  const parsedUrl = url.parse(reqUrl, true);
  return parsedUrl.pathname;
}

export function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(data));
}
