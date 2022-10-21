import {assertEquals, delay} from "../deps.test.ts";
import {listenIpRequest, listenIpBroadcast, postIpRequest, postIpBroadcast} from "../src/socket_ip.ts";

const ch1 = 0;
const ch2 = 1;

Deno.test({
    name: "IP: Listen and Broadcast.",
    async fn(){
        const ipc = listenIpBroadcast(ch1, (data:string)=>{
            assertEquals(data, "request");

            ipc.close();
        });

        await postIpBroadcast(ch1, "request");

        while(Deno.resources()[ipc.rid]){
            await delay(100);
        }
    }
});

Deno.test({
    name: "IP: Listen and Request.",
    async fn(){
        const ipc = listenIpRequest(ch2, (data:string)=>{
            assertEquals(data, "request");

            return "response";
        });

        const response = await postIpRequest<string, string>(ch2, "request");
        assertEquals(response, "response");

        ipc.close();
    }
});