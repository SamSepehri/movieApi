//Import HTTP , URL and File Sytem Modules
const http = require('http'),
  url = require('url');
  fs = require('fs'),

//Create HTTP server
http.createServer((request, response) => {
  let addr = request.url,
    q = url.parse(addr, true),
    filePath = '';

//Set up logging in log.txt
  fs.appendFile('log.txt', 'URL: ' + addr + '\nTimestamp: ' + new Date() + '\n\n', (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Added to log.');
    }
  });

//Check path, if wrong path send to homepage
  if (q.pathname.includes('documentation')) {
    filePath = (__dirname + '/documentation.html');
  } else {
    filePath = 'index.html';
  }
//Read file, throw error if not found
  fs.readFile(filePath, (err, data) => {
    if (err) {
      throw err;
    }
//Send HTTP Code 200 as response,  Set content type to text/html
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write(data);
    response.end();

  });
//Listen for requests on port 8080
}).listen(8080);
console.log('My test server is running on Port 8080.');
