import {assertEquals, delay} from "../deps.test.ts";
import {listenUdsRequest, listenUdsBroadcast, postUdsRequest, postUdsBroadcast} from "../src/ipc_uds.ts";

const ch1 = "ch0";
const ch2 = "ch1";

Deno.test({
    // << No Windows Support >>
    // This part will be removed if deno supports unix socket on windows.
    // Reference: https://github.com/tokio-rs/mio/pull/1610
    ignore: Deno.build.os === "windows",
    name: "UDS: Listen and Broadcast.",
    async fn(){
        const ipc = listenUdsBroadcast(ch1, (data:string)=>{
            assertEquals(data, "request");

            ipc.close();
        });

        await postUdsBroadcast(ch1, "request");

        while(Deno.resources()[ipc.rid]){
            await delay(100);
        }
    }
});

Deno.test({
    // << No Windows Support >>
    // This part will be removed if deno supports unix socket on windows.
    // Reference: https://github.com/tokio-rs/mio/pull/1610
    ignore: Deno.build.os === "windows",
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