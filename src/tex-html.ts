import katex from "katex";
import { createServer } from "http";
//console.log(katex.renderToString("\\mathscr\{O\}", { displayMode: true, output: "html"}));

let server = createServer( (request, reponse) =>
{
    if(request.method !== 'POST')
    {
        reponse.statusCode = 400;
        reponse.setHeader( 'Content-Type', 'text/plain');
        reponse.end('请发送POST请求');
    }
    else
    {
        let body = '';
        request.on('data', (data) => (body += data));
        request.on('end', function()
        {
            let post = JSON.parse(body);
            let type = post['displayMode'] ?? false;    // 表示默认采取行内公式模式
            let tex = post['tex'] ?? '';

            reponse.statusCode = 200;
            reponse.setHeader( 'Content-Type', 'text/plain');

            let result:string;

            if( tex === '')
            {
                reponse.end('');
            }
            else
            {
                try
                {
                    result = katex.renderToString( tex, { displayMode: type, output: 'html'});
                    reponse.end(result);
                }
                catch(err)
                {
                    if(err instanceof katex.ParseError)
                    {
                        result = ("Error in LaTeX: " + err.message)
                        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        reponse.end(result);
                    }
                    else
                    {
                        throw err;
                    }
                }
            }
        });
    }
});

server.listen(1200, '0.0.0.0', ()=>{
    console.log("收到信息,正在处理");
});