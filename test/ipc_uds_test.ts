import {assertEquals} from "https://deno.land/std@0.158.0/testing/asserts.ts";
import {ipcListen, ipcRequest, ipcBroadcast} from "../src/ipc_uds.ts";

Deno.test({
    name: "Listen and send using unix socket.",
    async fn(){
        const ch = "test-ch";

        const ipc = ipcListen(ch, (data:string)=>{
            assertEquals(data, "request");

            return "response";
        });

        await ipcBroadcast(ch, "request");
        const response = await ipcRequest<string, string>(ch, "request");

        assertEquals(response, "response");

        ipc.close();
    }
});