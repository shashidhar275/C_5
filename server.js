const http = require('http');   //CommonCore modules
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

const logEvents = require('./logEvents'); //Use of ./ is very much  necessary since we are importinig the custom modules
const EventEmitter = require('events');//Advanced common core modules

class Emitter extends EventEmitter {};

//Initialize object
const myEmitter = new Emitter();
myEmitter.on('log',(msg,fileName)=> logEvents(msg,fileName));
const PORT = process.env.PORT || 3500; //Port setup 1st step

const serveFile = async function(filePath,contentType,response){
    try{
        const rawData = await fsPromises.readFile(filePath,!contentType.includes('image')?'utf8':'');
        const data = contentType==='application/json'
            ? JSON.parse(rawData) : rawData;
        response.writeHead(filePath.includes('404.html')? 404 : 200, {'Content-Type': contentType});
        response.end(
            contentType === 'application/json' ? JSON.stringify(data) : data
        );
    }catch(err){
        console.log(err);
        myEmitter.emit('log',`${err.name}\t${err.message}`,'reqLog.txt');
        response.statusCode = 500;
        response.end();
    }
}

const server = http.createServer((req,res)=>{ // 2nd step
    console.log(req.url,req.method);    //This call back function gets executed every time the server receives an HTTP request
    myEmitter.emit('log',`${req.url}\t${req.method}`,'reqLog.txt');
    const extension = path.extname(req.url);
    let contentType;
    switch(extension){
        case '.css':
            contentType = 'text/css';
            break;
        case '.js': 
            contentType = 'text/javascript';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.jpg':
            contentType = 'image/jpeg';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.txt':
            contentType =  'text/plain';
            break;
        default:
            contentType = 'text/html';
            break;
    }
        let filePath =
        contentType === 'text/html' && req.url === '/'
            ? path.join(__dirname, 'views' , 'index.html')
            : contentType === 'text/html' && req.url.slice(-1) === '/'
                ? path.join(__dirname,'views',req.url,'index.html') //http://localhost:3500/subdir/ for this case 
                :contentType === 'text/html'
                    ? path.join(__dirname,'views',req.url)
                    : path.join(__dirname,req.url);
        //Makes .html extension not required in the browser
        if(!extension && req.url.slice(-1)  !=='/') filePath += '.html';
        
        const fileExists = fs.existsSync(filePath);
        if(fileExists){
                serveFile(filePath,contentType,res);
        }else{
            switch(path.parse(filePath).base){
                case 'old-page.html':
                    res.writeHead(301,{ 'Location' : '/new-page.html'});  //Redirecting the page (status code for redirect 301)
                    res.end();
                    break;
                case 'www-page.html':
                    res.writeHead(301, {'Location' : '/'});
                    res.end();
                    break;
                default:
                    serveFile(path.join(__dirname,'views','404.html'),'text/html',res);

            }
        }
});

server.listen(PORT,()=>console.log(`Server running on port ${PORT}`));// 3rd step(For where the server should listen for the http requests) It is where the HTTP server starts listening for incoming requests on the specified port

/*

    myEmitter.emit('log','Log event emitted');*/

/*
    if(req.url==='/' || req.url === '/index.html')
    {
        res.statusCode = 200;
        res.setHeader('Content-type','text/html');
        const filePath = path.join(__dirname,'views','index.html');
        fs.readFile(filePath,'utf8',(err,data)=>{
            res.end(data);
        })
    }


    Alternative for if condition 
    let path;
    switch(req.url){
        case '/':
            res.statusCode = 200;
            path = path.join(__dirname, 'views', 'index.html');
            fs.readFile(path,'utf8',(err,data)=>{
                res.end(data);
            });
            break;
        }
    */