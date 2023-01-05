# **Simple IPC for Deno**
![Actions-Test](https://github.com/dojyorin/deno_simple_ipc/actions/workflows/test.yaml/badge.svg)
![Actions-Release](https://github.com/dojyorin/deno_simple_ipc/actions/workflows/release.yaml/badge.svg)

The simple and lightweight module that wraps `Deno.listen()` and `Deno.connect()` for basic inter-process communication (IPC) in Deno.

# Example
This module is for Deno, but it's really raw socket communication, so it's compatible with processes on any different platforms.

<p>
<details>
<summary>Show more details...</summary>
<p>

**Server: TCP/IP**

```ts
// Without response.
listenIpBroadcast(49152, (data:string)=>{
    console.log(data); // => "ping"
});

// With response.
listenIpRequest(49152, (data:string)=>{
    console.log(data); // => "ping"
    return "pong";
});
```

**Server: UnixSocket**

```ts
// Without response.
listenUdsBroadcast("ch0", (data:string)=>{
    console.log(data); // => "ping"
});

// With response.
listenUdsRequest("ch0", (data:string)=>{
    console.log(data); // => "ping"
    return "pong";
});
```

**Client: TCP/IP**

```ts
// Without response.
await postIpBroadcast(49152, "ping");

// With response.
const response = await postIpRequest<string, string>(49152, "ping");
console.log(response); // => "pong"
```

**Client: UnixSocket**

```ts
// Without response.
await postUdsBroadcast("ch0", "ping");

// With response.
const response = await postUdsRequest<string, string>("ch0", "ping");
console.log(response); // => "pong"
```

</p>
</details>
</p>

# Details
With Deno's feature, you can choose between two communication methods.

- TCP/IP Socket
- Unix Socket

## TCP/IP Socket
As for the general TCP/IP method, this can be done by listening to a port on localhost `127.0.0.1`.

Unlike Unix Socket, which is described later, this is a better option because it can be used regardless of platform.

However UnixSocket is often faster in terms of performance.

## Unix Socket
Unix methods, can be used by enable Deno's `--unstable` flag.

Also the platform is only availables with Linux and Mac, not Windows.

This is not Deno's problem, but because the Rust library "tokio-rs/mio" that Deno uses internally does not support "AF_UNIX" on Windows.

Windows itself supports "AF_UNIX" in 10 insider build 17063, and a pull request has been submitted for support in "mio", so it may be possible to use it in Deno soon.

Reference: https://github.com/tokio-rs/mio/pull/1610

The path of the socket file is temporary directory `/tmp/{name}.sock`.

Also as mentioned above temporary directory `C:/Windows/Temp` is already defined for Windows in consideration of the possibility that Windows will be supported in the future.

# API
See [Deno Document](https://deno.land/x/simple_ipc/mod.ts) for details.