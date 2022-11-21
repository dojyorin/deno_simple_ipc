import {tmpPath, isWin} from "../deps.ts";
import {type MessageBody, type MessageHandler, handleRequest, handleBroadcast, sendRequest, sendBroadcast} from "./_socket.ts";

// Not yet available for Windows.
function excludeWindows(){
    if(isWin()){
        throw new Error("This feature only availables POSIX compatible system.");
    }
}

function socketPath(ch:string){
    if(/\W/.test(ch)){
        throw new Error();
    }

    return `${tmpPath()}/.${ch}.sock`;
}

function openServer(ch:string){
    excludeWindows();

    return Deno.listen({
        transport: "unix",
        path: socketPath(ch)
    });
}

async function openClient(ch:string){
    excludeWindows();

    return await Deno.connect({
        transport: "unix",
        path: socketPath(ch)
    });
}

function returnServer(server:Deno.Listener){
    return {
        get path(){
            return (<Deno.UnixAddr>server.addr).path;
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
* The path to the socket file will be `(tmp)/.(ch).socket`. `(tmp)` is `/tmp` for POSIX and `C:/Windows/Temp` for Windows.
* @summary Require the `--unstable` flag to use. Not yet available for Windows.
* @param ch Name of the socket file. Valid character patterns are `^\w+$`.
* @param onMessage Handler function that is called each time data is received from the remote client, Return value is the response data.
*/
export function listenUdsRequest<T extends MessageBody, U extends MessageBody>(ch:string, onMessage:MessageHandler<T, U>){
    const server = openServer(ch);
    handleRequest(server, onMessage);

    return returnServer(server);
}

/**
* The path to the socket file will be `(tmp)/.(ch).socket`. `(tmp)` is `/tmp` for POSIX and `C:/Windows/Temp` for Windows.
* @summary Require the `--unstable` flag to use. Not yet available for Windows.
* @param ch Name of the socket file. Valid character patterns are `^\w+$`.
* @param onMessage Handler function that is called each time data is received from the remote client.
*/
export function listenUdsBroadcast<T extends MessageBody>(ch:string, onMessage:MessageHandler<T, void>){
    const server = openServer(ch);
    handleBroadcast(server, onMessage);

    return returnServer(server);
}

/**
* The path to the socket file will be `(tmp)/.(ch).socket`. `(tmp)` is `/tmp` for POSIX and `C:/Windows/Temp` for Windows.
* @summary Require the `--unstable` flag to use. Not yet available for Windows.
* @param ch Name of the socket file. Valid character patterns are `^\w+$`.
* @param data Data to send to the remote host.
* @returns Response data from remote host.
*/
export async function postUdsRequest<T extends MessageBody, U extends MessageBody>(ch:string, data:T){
    const client = await openClient(ch);

    return await sendRequest<T, U>(client, data);
}

/**
* The path to the socket file will be `(tmp)/.(ch).socket`. `(tmp)` is `/tmp` for POSIX and `C:/Windows/Temp` for Windows.
* @summary Require the `--unstable` flag to use. Not yet available for Windows.
* @param ch Name of the socket file. Valid character patterns are `^\w+$`.
* @param data Data to send to the remote host.
*/
export async function postUdsBroadcast<T extends MessageBody>(ch:string, data:T){
    const client = await openClient(ch);

    await sendBroadcast(client, data);
}