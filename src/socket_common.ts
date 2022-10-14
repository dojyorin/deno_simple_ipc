import {type JsonValue, type VarnumOptions, readVarnum, writeVarnum, readAll, writeAll} from "../deps.ts";

export type MessageBody = JsonValue | Uint8Array;
export type MessageHandler<T extends MessageBody, U extends MessageBody | void> = (data:T) => U | Promise<U>;

const vnU8:VarnumOptions = {
    dataType: "uint8"
};

async function socketTx<T extends MessageBody>(con:Deno.Conn, data:T){
    const isbuf = data instanceof Uint8Array;
    const byte = isbuf ? data : new TextEncoder().encode(JSON.stringify(data));

    await writeVarnum(con, isbuf ? 1 : 0, vnU8);
    await writeAll(con, byte);
    await con.closeWrite();
}

async function socketRx<T extends MessageBody>(con:Deno.Conn){
    const isbuf = await readVarnum(con, vnU8);
    const byte = await readAll(con);

    return <T>(isbuf ? byte : JSON.parse(new TextDecoder().decode(byte)));
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

export async function postRequest<T extends MessageBody, U extends MessageBody>(socket:Deno.Conn, data:T){
    const promise = socketRx<U>(socket);
    await socketTx(socket, data);
    const response = await promise;
    socket.close();

    return response;
}

export async function postBroadcast<T extends MessageBody>(socket:Deno.Conn, data:T){
    await socketTx(socket, data);
    socket.close();
}