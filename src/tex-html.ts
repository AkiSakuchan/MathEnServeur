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
server.on('connection', (socket) => {
    console.log('连接建立');

    let recu = '';
    socket.on('data', (data:string) =>{
        // 因为并不能假设data中的数据是完整的, 因此约定以一个A字符为结尾
        recu += data;
        // 判断是否接受完所有数据
        if( data.toString().endsWith('A') )
        {
            recu = recu.slice(0, recu.length -1);   // 去除结尾的A避免JSON解析错误
        }
        else
        {
            console.log('收到部分数据');
            return;
        }

        let source:Request;
        try
        {
            source = JSON.parse(recu) as Request;
            recu = '';
        }
        catch(err)
        {
            if( err instanceof SyntaxError)
            {
                // 避免JSON语法错误把程序搞崩溃
                console.log('JSON语法错误:'+err.message);
                recu = '';
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
            socket.write(result);
        }
        catch(err)
        {
            if( err instanceof katex.ParseError)
            {
                // 避免 TeX 语法错误把程序搞崩溃
                let result = err.message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                recu = '';
                socket.write(result);
            }
            else
            {
                console.log('错误', err);
                throw err;
            }
        }
    });
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
})
server.listen(socketPath, ()=> console.log('监听中'));

// 手动结束进程时需要关闭套接字
process.on('SIGINT', ()=>{
    console.log('正在结束进程');
    server.close();
});
process.on('SIGTERM', ()=>{server.close();});