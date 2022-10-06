import {type JsonValue} from "https://deno.land/std@0.158.0/encoding/json/stream.ts";
import {readAll, writeAll} from "https://deno.land/std@0.158.0/streams/mod.ts";
import {type VarnumOptions, readVarnum, writeVarnum} from "https://deno.land/std@0.158.0/encoding/binary.ts";

// ==============================
// = Type Definition
// ==============================
export type IpcBody = JsonValue | Uint8Array;

export interface IpcListener{
    get path(): string;
    get rid(): number;
    close(): void;
}

// The original built-in type has a bug that UnixSocket properties are not defined in the Unstable version,
// so the extended type is temporarily applied.
interface UnixListenOptions extends Deno.UnixListenOptions{
    transport: "unix";
}

// ==============================
// = Runnable Code
// ==============================
const tempEnv = Deno.env.get("TEMP") ?? "";

const vnU8:VarnumOptions = {
    dataType: "uint8"
};

// Please implement the windows version soon!!
// I want to delete this item someday...
// Reference: https://github.com/tokio-rs/mio/pull/1610
function osValid(){
    if(Deno.build.os === "windows"){
        throw new Error("This feature only availables POSIX compatible system.");
    }
}

function unixOpt(ch:string){
    if(/\W/.test(ch)){
        throw new Error();
    }

    return <UnixListenOptions>{
        transport: "unix",
        path: `${tempEnv}/.ipc.${ch}`
    };
}

async function ipcTx<T extends IpcBody>(con:Deno.Conn, data:T){
    const isbuf = data instanceof Uint8Array;
    const byte = isbuf ? data : new TextEncoder().encode(JSON.stringify(data));

    await writeVarnum(con, isbuf ? 1 : 0, vnU8);
    await writeAll(con, byte);
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
export function ipcListen<T extends IpcBody, U extends IpcBody>(ch:string, onRequest:(data:T)=>U|void|Promise<U|void>){
    osValid();

    const server = Deno.listen(unixOpt(ch));

    (async()=>{
        for await(const con of server){
            (async()=>{
                const result = await onRequest(await ipcRx(con));

                if(result){
                    await ipcTx(con, result);
                }
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

    const con = await Deno.connect(unixOpt(ch));

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

    const con = await Deno.connect(unixOpt(ch));

    await ipcTx(con, data);
    con.close();
}