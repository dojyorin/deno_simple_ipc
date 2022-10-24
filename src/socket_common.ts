import {type JsonValue, type VarnumOptions, readVarnum, writeVarnum, readAll, writeAll} from "../deps.ts";

export type MessageBody = JsonValue | Uint8Array;
export type MessageHandler<T extends MessageBody, U extends MessageBody | void> = (data:T) => U | Promise<U>;

const vnU8:VarnumOptions = {
    dataType: "uint8"
};

function fSet(is:boolean, n:number){
    return is ? (1 << n) : 0;
}

function fGet(flag:number, n:number){
    return !!(flag & (1 << n));
}

function s2b(data:string){
    return new TextEncoder().encode(data);
}

function b2s(data:Uint8Array){
    return new TextDecoder().decode(data);
}

async function socketTx<T extends MessageBody>(con:Deno.Conn, data:T){
    const isByte = data instanceof Uint8Array;

    const flag = fSet(isByte, 0);
    const body = isByte ? data : s2b(JSON.stringify(data));

    await writeVarnum(con, flag, vnU8);
    await writeAll(con, body);
    await con.closeWrite();
}

async function socketRx<T extends MessageBody>(con:Deno.Conn){
    const flag = await readVarnum(con, vnU8);
    const body = await readAll(con);

    const isByte = fGet(flag, 0);

    return isByte ? <T>body : <T>JSON.parse(b2s(body));
}

export async function handleRequest<T extends MessageBody, U extends MessageBody>(server:Deno.Listener, onMessage:MessageHandler<T, U>){
    for await(const socket of server){
        (async()=>{
            const result = await onMessage(await socketRx(socket));
            await socketTx(socket, result);
            socket.close();
        })();
    }
}

export async function handleBroadcast<T extends MessageBody>(server:Deno.Listener, onMessage:MessageHandler<T, void>){
    for await(const socket of server){
        (async()=>{
            await onMessage(await socketRx(socket));
            socket.close();
        })();
    }
}

export async function sendRequest<T extends MessageBody, U extends MessageBody>(socket:Deno.Conn, data:T){
    const promise = socketRx<U>(socket);
    await socketTx(socket, data);
    const response = await promise;
    socket.close();

    return response;
}

export async function sendBroadcast<T extends MessageBody>(socket:Deno.Conn, data:T){
    await socketTx(socket, data);
    socket.close();
}