const http2 = require('http2');
const fs = require('fs');
const path = require('path');
const process = require('process');
const TextDecoder = require('util').TextDecoder;
const port = 9001;
const staticPath = path.join(__dirname, '../page/');
let buffer = Buffer.from('');
let saveRes = new Map();
const server = http2.createSecureServer({
  key: fs.readFileSync(path.join(__dirname, '../', 'localhost-privkey.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../', 'localhost-cert.pem'))
});
server.on('error', (err) => console.error(err));

server.on('request', (req, res) => {
  // router list
  if (/\.html$/.test(req.url)) {
    res.setHeader('content-type', 'text/html');
    res.end(fs.readFileSync(path.join(staticPath, req.url)));
  } else if (/\.js$/.test(req.url)) {
    res.setHeader('content-type', 'application/javascript');
    res.end(fs.readFileSync(path.join(staticPath, req.url)));
  } else if (req.headers[":path"].includes('send')){
    res.setHeader('content-type', 'text/plain');
    const id = /\/send\/(.*)/.exec(req.headers[":path"])[1];
    req.on('data', chunk => {
      buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;
      const decoder = new TextDecoder();
      console.log(decoder.decode(chunk, {stream: true}));
      saveRes.get(id).write(chunk);
      // fetch API will hide the response data when request body is not complete
      // not until request stream is closed or res.end() is called by server side will the fetch request promise fullfill
    })
  } else if (req.headers[":path"].includes('retrieve')) {
    res.setHeader('content-type', 'application/octet-stream');
    const id = /\/retrieve\/(.*)/.exec(req.headers[":path"])[1];
    saveRes.set(id, res);
    // hang the request

    // fetch API request promise will fullfill once res.write is called by server side
    // and res.body is readable as readable stream at client side

    // once res.write is called, response status code becomes 200 cuz response data is retrieved
    // though it is incomplete

  } else {
    res.end();
  }
});

server.listen(port, () => process.stdout.write(`Server started at ${port}\n`));