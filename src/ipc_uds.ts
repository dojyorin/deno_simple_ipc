import {type JsonValue} from "https://deno.land/std@0.158.0/encoding/json/stream.ts";
import {readAll, writeAll} from "https://deno.land/std@0.158.0/streams/mod.ts";
import {readVarnum, writeVarnum} from "https://deno.land/std@0.158.0/encoding/binary.ts";

type IpcBody = JsonValue | Uint8Array;

interface UnixListenOptions extends Deno.UnixListenOptions{
    transport: "unix";
}

export class IpcUds{
    static #onlyWord(s:string){
        if(/\W/.test(s)){
            throw new Error();
        }
    }

    static get #varnumOpt(){
        return <const>{
            dataType: "uint8"
        };
    }

    static async #tx<T extends IpcBody>(con:Deno.Conn, data:T){
        const isbuf = data instanceof Uint8Array;
        const byte = isbuf ? data : new TextEncoder().encode(JSON.stringify(data));

        await writeVarnum(con, isbuf ? 1 : 0, IpcUds.#varnumOpt);
        await writeAll(con, byte);
    }

    static async #rx<T extends IpcBody>(con:Deno.Conn){
        const isbuf = await readVarnum(con, IpcUds.#varnumOpt);
        const byte = await readAll(con);

        return <T>(isbuf ? byte : JSON.parse(new TextDecoder().decode(byte)));
    }

    #path:string;
    #server:Deno.Listener|null;

    /**
    * The path to the socket file will be `(tempdir)/.ipc.(ch)`.
    * @param ch Socket identifier, Only allowed character is `\w` in regular expressions.
    **/
    constructor(ch:string){
        // Please implement the windows version soon!!
        // I want to delete this item someday...
        // Reference: https://github.com/tokio-rs/mio/pull/1610
        if(Deno.build.os === "windows"){
            throw new Error("This feature only availables POSIX compatible system.");
        }

        IpcUds.#onlyWord(ch);

        this.#path = `${Deno.env.get("TEMP")}/.ipc.${ch}`;
        this.#server = null;
    }

    get #udsOpt(){
        return <UnixListenOptions>{
            transport: "unix",
            path: this.#path
        };
    }

    /**
    * Close socket and remove file.
    **/
    close(){
        if(!this.#server){
            return;
        }

        this.#server.close();
        Deno.removeSync(this.#path);
    }

    /**
    * @param onRequest A handler function that is called each time data is received from the remote client.
    * If this function return value, it will send a response to the connection.
    * If void it will not send a response.
    **/
    listen<T extends IpcBody>(onRequest:(data:T)=>T|void|Promise<T|void>){
        if(this.#server){
            throw new Error();
        }

        this.#server = Deno.listen(this.#udsOpt);

        (async()=>{
            if(!this.#server){
                throw new Error();
            }

            for await(const con of this.#server){
                (async()=>{
                    const result = await onRequest(await IpcUds.#rx(con));

                    if(result){
                        await IpcUds.#tx(con, result);
                    }
                })();
            }
        })();
    }

    /**
    * @param data Send to remote server.
    **/
    async request<T extends IpcBody, U extends IpcBody>(data:U){
        const con = await Deno.connect(this.#udsOpt);

        const handler = IpcUds.#rx<T>(con);
        await IpcUds.#tx(con, data);
        const response = await handler;
        con.close();

        return response;
    }

    /**
    * @param data Send to remote server.
    **/
    async broadcast<T extends IpcBody>(data:T){
        const con = await Deno.connect(this.#udsOpt);

        await IpcUds.#tx(con, data);
        con.close();
    }
}