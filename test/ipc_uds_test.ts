import {assertEquals} from "https://deno.land/std@0.158.0/testing/asserts.ts";
import {ipcListen, ipcRequest, ipcBroadcast} from "../src/ipc_uds.ts";

const ch = "test-ch";

Deno.test({
    name: "Listen and send using unix socket.",
    async fn(){
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