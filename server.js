// get dependancies
var http = require('http');
var fs = require('fs');
var crc = require('dnp3-crc');

//create server
server = http.createServer( function(req, res) {

    if (req.method == 'POST') {
        var body = '';
        var responseParse = [];
        var crcCount = 0;
        var crcInput = [];
        var texty = "";

        req.on('data', function (data) {
            body += data;
            
            body = body.slice(4, body.length);
            responseParse = body.split('+');
            
            body = ""
            crcCount = 0;
            
            responseParse.forEach(function (element) {

                crcInput[crcCount] = '0x' + element;
                body += element + " ";

                if (crcCount == 7) {
                    texty = crc.calculate(crcInput).toString(16);
                    body += texty[2] + texty[3] + " " + texty[0] + texty[1] + " ";
                    crcCount = 0; 
                } else { 
                    crcCount += 1; 
                }

            });

            body = body.slice(0, body.length-1);
            
            console.log(Date() + "\n" + " Response: " + body);

        });

        var html = fs.readFileSync('script.html');
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(html);
    }
    else
    {
        var html = fs.readFileSync('script.html');
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(html);
    }

});





port = 3000;
host = '127.0.0.1';
server.listen(port, host);
console.log('Listening at http://' + host + ':' + port);
