import {assertEquals} from "../deps.test.ts";
import {ipcListen, ipcRequest, ipcBroadcast} from "../src/ipc_uds.ts";

const ch1 = "test_ch1";
const ch2 = "test_ch2";

Deno.test({
    name: "Listen and Broadcast.",
    async fn(){
        const handle = new Promise<void>((done)=>{
            const ipc = ipcListen(ch1, (data:string)=>{
                assertEquals(data, "request");
                ipc.close();

                done();
            });
        });

        await ipcBroadcast(ch1, "request");
        await handle;
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

        ipc.close();
    }
});