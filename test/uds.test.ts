import {assertEquals, delay, isWin} from "../deps.test.ts";
import {listenUdsRequest, listenUdsBroadcast, postUdsRequest, postUdsBroadcast} from "../src/uds.ts";

const ch0 = "ch0";
const ch1 = "ch1";

Deno.test({
    // Not yet available for Windows.
    ignore: isWin(),
    name: "UDS: Listen and Broadcast",
    async fn(){
        const ipc = listenUdsBroadcast(ch0, (data:string)=>{
            assertEquals(data, "request");

            ipc.close();
        });

        await postUdsBroadcast(ch0, "request");

        while(Deno.resources()[ipc.rid]){
            await delay(100);
        }
    }
});

Deno.test({
    // Not yet available for Windows.
    ignore: isWin(),
    name: "UDS: Listen and Request",
    async fn(){
        const ipc = listenUdsRequest(ch1, (data:string)=>{
            assertEquals(data, "request");

            return "response";
        });

        const response = await postUdsRequest<string, string>(ch1, "request");
        assertEquals(response, "response");

        ipc.close();
    }
});