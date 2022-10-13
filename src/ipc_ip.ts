import {type MessageBody, type MessageHandler, handleRequest, handleBroadcast, postRequest, postBroadcast} from "./ipc_common.ts";

function ephemeralPort(ch:number){
    if(ch < 0 || 16383 < ch){
        throw new Error();
    }

    return 49152 + ch;
}

function openServer(ch:number){
    return Deno.listen({
        transport: "tcp",
        hostname: "127.0.0.1",
        port: ephemeralPort(ch)
    });
}

async function openClient(ch:number){
    return await Deno.connect({
        transport: "tcp",
        hostname: "127.0.0.1",
        port: ephemeralPort(ch)
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
export function listenIpRequest<T extends MessageBody, U extends MessageBody>(ch:number, onMessage:MessageHandler<T, U>){
    const server = openServer(ch);
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
export function listenIpBroadcast<T extends MessageBody>(ch:number, onMessage:MessageHandler<T, void>){
    const server = openServer(ch);
    handleBroadcast(server, onMessage);

    return returnServer(server);
}

/**
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param data Send to remote server.
**/
export async function postIpRequest<T extends MessageBody, U extends MessageBody>(ch:number, data:T){
    const client = await openClient(ch);

    return await postRequest<T, U>(client, data);
}

/**
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param data Send to remote server.
**/
export async function postIpBroadcast<T extends MessageBody>(ch:number, data:T){
    const client = await openClient(ch);

    await postBroadcast(client, data);
}