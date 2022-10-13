import {type MessageBody, type MessageHandler, handleRequest, handleBroadcast, postRequest, postBroadcast} from "./ipc_common.ts";

const tmpDirectory = Deno.build.os === "windows" ? "C:/Windows/Temp": "/tmp";

// << No Windows Support >>
// This part will be removed if deno supports unix socket on windows.
// Reference: https://github.com/tokio-rs/mio/pull/1610
function excludeWindows(){
    if(Deno.build.os === "windows"){
        throw new Error("This feature only availables POSIX compatible system.");
    }
}

function socketPath(ch:string){
    if(/\W/.test(ch)){
        throw new Error();
    }

    return `${tmpDirectory}/.socket.${ch}`;
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
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param onMessage A handler function that is called each time data is received from the remote client,
* If this function return value, it will send a response to the connection,
* If void it will not send a response.
**/
export function listenUdsRequest<T extends MessageBody, U extends MessageBody>(ch:string, onMessage:MessageHandler<T, U>){
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
export function listenUdsBroadcast<T extends MessageBody>(ch:string, onMessage:MessageHandler<T, void>){
    const server = openServer(ch);
    handleBroadcast(server, onMessage);

    return returnServer(server);
}

/**
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param data Send to remote server.
**/
export async function postUdsRequest<T extends MessageBody, U extends MessageBody>(ch:string, data:T){
    const client = await openClient(ch);

    return await postRequest<T, U>(client, data);
}

/**
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param data Send to remote server.
**/
export async function postUdsBroadcast<T extends MessageBody>(ch:string, data:T){
    const client = await openClient(ch);

    await postBroadcast(client, data);
}