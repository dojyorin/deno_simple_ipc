import {type MessageBody, type MessageHandler, handleRequest, handleBroadcast, postRequest, postBroadcast} from "./ipc_common.ts";

function ephemeralPort(port:number){
    if(port < 0 || 16383 < port){
        throw new Error();
    }

    return 49152 + port;
}

function openServer(port:number){
    return Deno.listen({
        transport: "tcp",
        hostname: "127.0.0.1",
        port: ephemeralPort(port)
    });
}

async function openClient(port:number){
    return await Deno.connect({
        transport: "tcp",
        hostname: "127.0.0.1",
        port: ephemeralPort(port)
    });
}

function returnServer(server:Deno.Listener){
    return {
        get host(){
            return (<Deno.NetAddr>server.addr).hostname;
        },

        get port(){
            return (<Deno.NetAddr>server.addr).port;
        },

        get rid(){
            return server.rid;
        },

        close(){
            server.close();
        }
    };
}

/**
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param onMessage A handler function that is called each time data is received from the remote client,
* If this function return value, it will send a response to the connection,
* If void it will not send a response.
**/
export function listenIpRequest<T extends MessageBody, U extends MessageBody>(port:number, onMessage:MessageHandler<T, U>){
    const server = openServer(port);
    handleRequest(server, onMessage);

    return returnServer(server);
}

/**
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param onMessage A handler function that is called each time data is received from the remote client,
* If this function return value, it will send a response to the connection,
* If void it will not send a response.
**/
export function listenIpBroadcast<T extends MessageBody>(port:number, onMessage:MessageHandler<T, void>){
    const server = openServer(port);
    handleBroadcast(server, onMessage);

    return returnServer(server);
}

/**
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param data Send to remote server.
**/
export async function postIpRequest<T extends MessageBody, U extends MessageBody>(port:number, data:T){
    const client = await openClient(port);

    return await postRequest<T, U>(client, data);
}

/**
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param data Send to remote server.
**/
export async function postIpBroadcast<T extends MessageBody>(port:number, data:T){
    const client = await openClient(port);

    await postBroadcast(client, data);
}