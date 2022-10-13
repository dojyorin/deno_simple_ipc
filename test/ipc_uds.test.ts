import {assertEquals, delay} from "../deps.test.ts";
import {listenUdsRequest, listenUdsBroadcast, postUdsRequest, postUdsBroadcast} from "../src/ipc_uds.ts";

const ch1 = "ch1";
const ch2 = "ch2";

function isAlive(rid:number){
    return Deno.resources()[rid] === "unixListener";
}

Deno.test({
    name: "UDS: Listen and Broadcast.",
    async fn(){
        const ipc = listenUdsBroadcast(ch1, (data:string)=>{
            assertEquals(data, "request");

            ipc.close();
        });

        await postUdsBroadcast(ch1, "request");

        while(isAlive(ipc.rid)){
            await delay(100);
        }
    }
});

Deno.test({
    name: "UDS: Listen and Request.",
    async fn(){
        const ipc = listenUdsRequest(ch2, (data:string)=>{
            assertEquals(data, "request");

            return "response";
        });

        const response = await postUdsRequest<string, string>(ch2, "request");
        assertEquals(response, "response");

        ipc.close();
    }
});