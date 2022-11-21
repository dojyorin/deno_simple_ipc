import {type MessageBody, type MessageHandler, handleRequest, handleBroadcast, sendRequest, sendBroadcast} from "./_socket.ts";

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
* The port range it can listen on is `49152` ~ `65535` (ephemeral ports).
* @param ch Listen port number from `0` ~ `16383`. The actual port number will be the value with `49152` added internally.
* @param onMessage Handler function that is called each time data is received from the remote client, Return value is the response data.
*/
export function listenIpRequest<T extends MessageBody, U extends MessageBody>(ch:number, onMessage:MessageHandler<T, U>){
    const server = openServer(ch);
    handleRequest(server, onMessage);

    return returnServer(server);
}

/**
* The port range it can listen on is `49152` ~ `65535` (ephemeral ports).
* @param ch Listen port number from `0` ~ `16383`. The actual port number will be the value with `49152` added internally.
* @param onMessage Handler function that is called each time data is received from the remote client.
*/
export function listenIpBroadcast<T extends MessageBody>(ch:number, onMessage:MessageHandler<T, void>){
    const server = openServer(ch);
    handleBroadcast(server, onMessage);

    return returnServer(server);
}

/**
* The port range it can listen on is `49152` ~ `65535` (ephemeral ports).
* @param ch Listen port number from `0` ~ `16383`. The actual port number will be the value with `49152` added internally.
* @param data Data to send to the remote host.
* @returns Response data from remote host.
*/
export async function postIpRequest<T extends MessageBody, U extends MessageBody>(ch:number, data:T){
    const client = await openClient(ch);

    return await sendRequest<T, U>(client, data);
}

/**
* The port range it can listen on is `49152` ~ `65535` (ephemeral ports).
* @param ch Listen port number from `0` ~ `16383`. The actual port number will be the value with `49152` added internally.
* @param data Data to send to the remote host.
*/
export async function postIpBroadcast<T extends MessageBody>(ch:number, data:T){
    const client = await openClient(ch);

    await sendBroadcast(client, data);
}