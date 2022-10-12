import {assertEquals, delay} from "../deps.test.ts";
import {ipcListen, ipcRequest, ipcBroadcast} from "../src/ipc_uds.ts";

const ch1 = "test_ch1";
const ch2 = "test_ch2";

function isAlive(rid:number){
    return Deno.resources()[rid] === "unixListener";
}

Deno.test({
    name: "Listen and Broadcast.",
    async fn(){
        const ipc = ipcListen(ch1, (data:string)=>{
            assertEquals(data, "request");
            ipc.close();
        });

        await ipcBroadcast(ch1, "request");

        while(isAlive(ipc.rid)){
            await delay(100);
        }
    }
});

Deno.test({
    name: "Listen and Request.",
    async fn(){
        const ipc = ipcListen(ch2, (data:string)=>{
            assertEquals(data, "request");

            return "response";
        });

        const response = await ipcRequest<string, string>(ch2, "request");
        assertEquals(response, "response");

        while(isAlive(ipc.rid)){
            await delay(100);
        }
    }
});