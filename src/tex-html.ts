import katex from "katex";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { ProtoGrpcType } from "./grpc-serveur";
import { RPCHandlers } from './commutationJsPhp/RPC';

protoLoader.load('./src/grpc-serveur.proto').then(packageDefinition =>{
    const RPCServer : RPCHandlers = {
        render(call, callback)
        {
            try
            {
                let type = call.request.display as boolean;
                let tex = call.request.tex as string;

                if( tex === '')
                {
                    callback && callback(null, {html: ''});
                }
                else
                {
                    try
                    {
                        callback && callback(null, {html: katex.renderToString( tex, { displayMode: type, output: 'html'})});
                    }
                    catch(err)
                    {
                        if(err instanceof katex.ParseError)
                        {
                            let result = ("LaTeX 代码错误: " + err.message)
                            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                            callback && callback(null, {html: result});
                        }
                        else
                        {
                            console.log('服务端出错');
                            throw err;
                        }
                    }
                }
            }
            catch(err)
            {
                console.log('服务端出错');
                //@ts-ignore
                callback && callback(err);
            }
        }
    }

    const descriptor = ( grpc.loadPackageDefinition(packageDefinition) as unknown) as ProtoGrpcType;
    const server = new grpc.Server();
    server.addService(descriptor.commutationJsPhp.RPC.service, RPCServer);

    server.bindAsync('0.0.0.0:1200', grpc.ServerCredentials.createInsecure(), () => {server.start(); console.log('服务已启动');});
}).catch(err => {
    console.log('服务未能启动', err);
});