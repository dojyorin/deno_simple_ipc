import {assertEquals} from "../deps.test.ts";
import {ipcListen, ipcRequest, ipcBroadcast} from "../src/ipc_uds.ts";

const ch = "test_ch";

Deno.test({
    name: "Listen and send using unix socket.",
    async fn(){
        const ipc = ipcListen(ch, (data:string)=>{
            assertEquals(data, "request");
            ipc.close();
            // return "response";
        });

        await ipcBroadcast(ch, "request");
        // const response = await ipcRequest<string, string>(ch, "request");

        // assertEquals(response, "response");

        // ipc.close();
    }
});