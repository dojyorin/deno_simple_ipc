export function tmpPath(){
    return Deno.build.os === "windows" ? "C:/Windows/Temp" : "/tmp";
}