import katex from "katex";
import net from "net";

// unix 域套接字路径
let socketPath = '/tmp/php-js.sock';
interface Request
{
    display: boolean;
    tex: string;
}

let server = net.createServer();
let sockets : Array<net.Socket> = [];   // 用于记录以连接的套接字, 以便推出时能清理干净

server.on('connection', (socket) => {
    console.log('连接建立');
    sockets.push(socket);

    let recu = '';
    socket.on('data', (data:string) =>{
        // 并不能假设data中的数据是完整的
        recu += data;
    });

    socket.on('end', () => {
        let source:Request;
        try
        {
            source = JSON.parse(recu) as Request;
        }
        catch(err)
        {
            if( err instanceof SyntaxError)
            {
                // 避免JSON语法错误把程序搞崩溃
                console.log('JSON语法错误:'+err.message);
                return;
            }
            else
            {
                throw err;
            }
        }
        try
        {
            let result = katex.renderToString( source.tex, {displayMode: source.display, output: 'html' });
            console.log(Date.now());
            socket.end(result);
        }
        catch(err)
        {
            if( err instanceof katex.ParseError)
            {
                // 避免 TeX 语法错误把程序搞崩溃
                let result = err.message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                recu = '';
                socket.end(result);
            }
            else
            {
                console.log('错误', err);
            }
        }
    });

    socket.on('close', (hadError) =>
    {
        sockets.splice(sockets.indexOf(socket), 1);
        if(!hadError)
        {
            console.log('连接正常关闭');
        }
    })
    
    socket.on('error', (err) => {
        console.log('错误:',err.message);
    })
    console.log('建立监听函数');
});
server.on('error', (err:NodeJS.ErrnoException)=>{
    if(err.code === 'EADDRINUSE')
    {
        console.log('套接字 ' + socketPath + ' 已被占用, 请换一个路径或删除对应套接字文件');
        process.exit(1);
    }
});
server.listen(socketPath, ()=> console.log('监听中'));

// 手动结束进程时需要关闭套接字
process.on('SIGINT', ()=>{
    console.log('正在结束进程');
    server.close();

    // 强制关闭已经连接的套接字, 避免阻碍正常退出
    sockets.forEach((socket) => {
        socket.destroy();
    });
});
process.on('SIGTERM', ()=>{
    server.close();
    sockets.forEach((socket) => {
        socket.destroy();
    });
});