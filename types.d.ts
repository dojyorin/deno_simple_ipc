import {type JsonValue} from "https://deno.land/std@0.158.0/encoding/json/stream.ts";

export type IpcBody = JsonValue | Uint8Array;

export interface UnixListenOptions extends Deno.UnixListenOptions{
    transport: "unix";
}