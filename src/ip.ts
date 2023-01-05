import {type MessageBody, type MessageHandler, handleRequest, handleBroadcast, sendRequest, sendBroadcast} from "./socket.ts";

function ephemeralPort(ch:number){
    if(ch < 49152 || 65535 < ch){
        throw new Error();
    }

    return ch;
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
* @param ch Listen port number from `49152` ~ `65535`.
* @param onMessage Handler function that is called each time data is received from the remote client, Return value is the response data.
* @return Server resource context.
*/
export function listenIpRequest<T extends MessageBody, U extends MessageBody>(ch:number, onMessage:MessageHandler<T, U>){
    const server = openServer(ch);
    handleRequest(server, onMessage);

    return returnServer(server);
}

/**
* The port range it can listen on is `49152` ~ `65535` (ephemeral ports).
* @param ch Listen port number from `49152` ~ `65535`.
* @param onMessage Handler function that is called each time data is received from the remote client.
* @return Server resource context.
*/
export function listenIpBroadcast<T extends MessageBody>(ch:number, onMessage:MessageHandler<T, void>){
    const server = openServer(ch);
    handleBroadcast(server, onMessage);

    return returnServer(server);
}

/**
* The port range it can listen on is `49152` ~ `65535` (ephemeral ports).
* @param ch Destination port number from `49152` ~ `65535`.
* @param data Data to send to the remote host.
* @return Response data from remote host.
*/
export async function postIpRequest<T extends MessageBody, U extends MessageBody>(ch:number, data:T){
    const client = await openClient(ch);

    return await sendRequest<T, U>(client, data);
}

/**
* The port range it can listen on is `49152` ~ `65535` (ephemeral ports).
* @param ch Destination port number from `49152` ~ `65535`.
* @param data Data to send to the remote host.
*/
export async function postIpBroadcast<T extends MessageBody>(ch:number, data:T){
    const client = await openClient(ch);

    await sendBroadcast(client, data);
}