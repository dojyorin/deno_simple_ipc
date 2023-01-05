import {assertEquals, delay} from "../deps.test.ts";
import {listenIpRequest, listenIpBroadcast, postIpRequest, postIpBroadcast} from "../src/ip.ts";

const ch0 = 49152;
const ch1 = 49153;

Deno.test({
    name: "IP: Listen and Broadcast",
    async fn(){
        const ipc = listenIpBroadcast(ch0, (data:string)=>{
            assertEquals(data, "request");

            ipc.close();
        });

        await postIpBroadcast(ch0, "request");

        while(Deno.resources()[ipc.rid]){
            await delay(100);
        }
    }
});

Deno.test({
    name: "IP: Listen and Request",
    async fn(){
        const ipc = listenIpRequest(ch1, (data:string)=>{
            assertEquals(data, "request");

            return "response";
        });

        const response = await postIpRequest<string, string>(ch1, "request");
        assertEquals(response, "response");

        ipc.close();
    }
});