import {type JsonValue, type VarnumOptions, readVarnum, writeVarnum, readAll, writeAll} from "../deps.ts";

export type IpcBody = JsonValue | Uint8Array;

export interface IpcListener{
    get path(): string;
    get rid(): number;
    close(): void;
}

const vnU8:VarnumOptions = {
    dataType: "uint8"
};

async function ipcTx<T extends IpcBody>(con:Deno.Conn, data:T){
    const isbuf = data instanceof Uint8Array;
    const byte = isbuf ? data : new TextEncoder().encode(JSON.stringify(data));

    await writeVarnum(con, isbuf ? 1 : 0, vnU8);
    await writeAll(con, byte);
    await con.closeWrite();
}

async function ipcRx<T extends IpcBody>(con:Deno.Conn){
    const isbuf = await readVarnum(con, vnU8);
    const byte = await readAll(con);

    return <T>(isbuf ? byte : JSON.parse(new TextDecoder().decode(byte)));
}

/**
* The path to the socket file will be `(tempdir)/.ipc.(ch)`.
* @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
* @param onRequest A handler function that is called each time data is received from the remote client,
* If this function return value, it will send a response to the connection,
* If void it will not send a response.
**/
export function ipcListen<T extends IpcBody, U extends IpcBody>(server:Deno.Listener, onRequest:(data:T)=>U|void|Promise<U|void>){
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
export async function ipcRequest<T extends IpcBody, U extends IpcBody>(con:Deno.Conn, data:T){
    osValid();

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
export async function ipcBroadcast<T extends IpcBody>(con:Deno.Conn, data:T){
    osValid();

    await ipcTx(con, data);
    con.close();
}