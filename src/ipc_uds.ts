import {type JsonValue, type VarnumOptions, readVarnum, writeVarnum, readAll, writeAll} from "../deps.ts";
import {type IpcBody, type IpcListener, } from "./util.ts";

const osWin = Deno.build.os === "windows";
const tmpDir = osWin ? "C:/Windows/Temp": "/tmp";

function ipcPath(ch:string){
    if(/\W/.test(ch)){
        throw new Error();
    }

    return `${tmpDir}/.ipc.${ch}`;
}

// << No Windows Support >>
// Please implement the windows version soon!!
// I want to delete this item someday...
// Reference: https://github.com/tokio-rs/mio/pull/1610
function osValid(){
    if(osWin){
        throw new Error("This feature only availables POSIX compatible system.");
    }
}

/**
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param onRequest A handler function that is called each time data is received from the remote client,
* If this function return value, it will send a response to the connection,
* If void it will not send a response.
**/
export function udsListen<T extends IpcBody, U extends IpcBody>(ch:string, onRequest:(data:T)=>U|void|Promise<U|void>){
    osValid();

    const server = Deno.listen({
        transport: "unix",
        path: ipcPath(ch)
    });
}

/**
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param data Send to remote server.
**/
export async function udsRequest<T extends IpcBody, U extends IpcBody>(ch:string, data:T){
    osValid();

    const con = await Deno.connect({
        transport: "unix",
        path: ipcPath(ch)
    });
}

/**
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param data Send to remote server.
**/
export async function udsBroadcast<T extends IpcBody>(ch:string, data:T){
    osValid();

    const con = await Deno.connect({
        transport: "unix",
        path: ipcPath(ch)
    });
}