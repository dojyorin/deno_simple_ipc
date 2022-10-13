import {type JsonValue, type VarnumOptions, readVarnum, writeVarnum, readAll, writeAll} from "../deps.ts";
import {type IpcBody, type IpcListener, } from "./util.ts";

/**
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param onRequest A handler function that is called each time data is received from the remote client,
* If this function return value, it will send a response to the connection,
* If void it will not send a response.
**/
export function ipcListen<T extends IpcBody, U extends IpcBody>(ch:string, onRequest:(data:T)=>U|void|Promise<U|void>){
    osValid();

    const server = Deno.listen({
        transport: "unix",
        path: ipcPath(ch)
    });

    (async()=>{
        for await(const con of server){
            (async()=>{
                const result = await onRequest(await ipcRx(con));

                if(result){
                    await ipcTx(con, result);
                }

                con.close();
            })();
        }
    })();

    return <IpcListener>{
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
* @param data Send to remote server.
**/
export async function ipcRequest<T extends IpcBody, U extends IpcBody>(ch:string, data:T){
    osValid();

    const con = await Deno.connect({
        transport: "unix",
        path: ipcPath(ch)
    });

    const handler = ipcRx<U>(con);
    await ipcTx(con, data);
    const response = await handler;
    con.close();

    return response;
}

/**
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param data Send to remote server.
**/
export async function ipcBroadcast<T extends IpcBody>(ch:string, data:T){
    osValid();

    const con = await Deno.connect({
        transport: "unix",
        path: ipcPath(ch)
    });

    await ipcTx(con, data);
    con.close();
}