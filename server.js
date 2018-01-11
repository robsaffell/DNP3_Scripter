// get dependancies
let http = require('http');
let fs = require('fs');
let crc = require('dnp3-crc');
let crypto = require('crypto'), algorithm = "sha1", password = "00000";
let modbus = require('node-modbus');


//create server
server = http.createServer( function(req, res) {

    if (req.method == 'POST') {
        let body = '';
        let responseParse = [];
        let crcCount = 0;
        let crcInput = [];
        let texty = "";
        let selectedAlgorithm = "";
        let portSelect = "";

        req.on('data', function (data) {
            body += data;
            
            body = body.slice(4, body.length);
            responseParse = body.split('+');
            
            responseParse.pop();

            portSelect = responseParse.pop();
            selectedAlgorithm = responseParse.pop();

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

            //Pull the string response from web UI, parse it and begin pulling information out of it
            body = body.slice(0, body.length-1);
            
            //Report to console Time/Date, communication and comm parameters
            console.log(Date() + "\n" + " Response: " + body);
            console.log("Hash: " + selectedAlgorithm);

            //Use the standard Node libs to build a hash based on selection
            var hashBuild = crypto.createHash(selectedAlgorithm).update(data).digest("hex");
            console.log("Msg Digest w " + selectedAlgorithm + ": " + hashBuild);
            
            //Establish modbus comms on the selected port number
            if(portSelect === 'serial') {            
                const client = modbus.client.serial.complete({
                    'portName': '/dev/ttyS0', /* COM1 */
                    'baudRate': 9600, /* */
                    'dataBits': 8, /* 5, 6, 7 */
                    'stopBits': 1, /* 1.5, 2 */
                    'parity': 'none', /* even, odd, mark, space */
                    'connectionType': 'RTU', /* RTU or ASCII */
                    'connectionDelay': 250, /* 250 msec - sometimes you need more on windows */
                    'timeout': 2000, /* 2 sec */
                    'autoReconnect': true, /* reconnect on connection is lost */
                    'reconnectTimeout': 15000, /* wait 15 sec if auto reconnect fails to often */
                    'logLabel' : 'ModbusClientSerial', /* label to identify in log files */
                    'logLevel': 'debug', /* for less log use: info, warn or error */
                    'logEnabled': true
            });} else if (portSelect != '' && typeof(portSelect) === 'number') {
                    const client = modbus.client.tcp.complete({
                        'host': 'modbus.server.local', /* IP or name of server host */
                        'port': portSelect, /* well known Modbus port */
                        'unitId': 1, 
                        'timeout': 2000, /* 2 sec */
                        'autoReconnect': true, /* reconnect on connection is lost */
                        'reconnectTimeout': 15000, /* wait 15 sec if auto reconnect fails to often */
                        'logLabel' : 'ModbusClientTCP', /* label to identify in log files */
                        'logLevel': 'debug', /* for less log use: info, warn or error */
                        'logEnabled': true
                    })
                    
                    const time_interval = 1000
                    client.connect()
                    client.on('connect', function () {
                    setInterval( function () {
                        client.readCoils(0, 13).then((response) => console.log(response.payload))
                    }, time_interval) /* reading coils every second */
                    })
            }
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
