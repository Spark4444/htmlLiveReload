let http = require("http");
let fs = require("fs");
let path = require("path");
let WebSocket = require("ws");

let filePath = path.join(__dirname, "index.html");

let port = 3000;

let server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url == "/" ? "index.html" : req.url);
    let extName = String(path.extname(filePath)).toLowerCase();
    let extTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.svg': 'application/image/svg+xml'
    };

    let fileType = extTypes[extName] || "application/octet-stream";

    fs.readFile(filePath, (err, data) => {
        if(err) throw err;
        else if(extName == ".html"){
            res.writeHead(200, {"Content-Type": "text/html"});
            let html = data.toString();
            let wsScript = `
            <!-- Code injected by the server -->
            <script>
                let socket = new WebSocket("ws://localhost:${port}");
                socket.onmessage = function(event) {
                    if(event.data == "reload"){
                        window.location.reload();
                    }
                }
            </script>
            `;
            html = html.replace("</body>", `${wsScript}</body>`);
            res.write(html);
            res.end();
        }
        else {
            res.writeHead(200, { 'Content-Type': fileType });
            res.end(data, 'utf-8');
        }
    })
}).listen(port);

let wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
    console.log("Connected");
})

fs.watch(filePath, (event, fileName) => {
    if(fileName && event == "change"){
        console.log("file changed");
        wss.clients.forEach(client => {
            if(client.readyState == WebSocket.OPEN){
                client.send("reload");
            }
        });
    }
});

console.log("Server running at http://localhost:3000/");