import {type JsonValue, type VarnumOptions, readVarnum, writeVarnum, readAll, writeAll} from "../deps.ts";

export type MessageBody = JsonValue | Uint8Array;
export type MessageHandler<T extends MessageBody, U extends MessageBody | void> = (data:T) => U | Promise<U>;

const typeU8:VarnumOptions = {
    dataType: "uint8"
};

function bitSet(is:boolean, n:number){
    return is ? (1 << n) : 0;
}

function bitGet(flag:number, n:number){
    return !!(flag & (1 << n));
}

function text2byte(data:string){
    return new TextEncoder().encode(data);
}

function byte2text(data:Uint8Array){
    return new TextDecoder().decode(data);
}

async function socketTx<T extends MessageBody>(con:Deno.Conn, data:T){
    const isByte = data instanceof Uint8Array;

    const flag = bitSet(isByte, 0);
    const body = isByte ? data : text2byte(JSON.stringify(data));

    await writeVarnum(con, flag, typeU8);
    await writeAll(con, body);
    await con.closeWrite();
}

async function socketRx<T extends MessageBody>(con:Deno.Conn){
    const flag = await readVarnum(con, typeU8);
    const body = await readAll(con);

    const isByte = bitGet(flag, 0);

    return isByte ? <T>body : <T>JSON.parse(byte2text(body));
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