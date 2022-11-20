# **Simple IPC for Deno**
![Actions-Test](https://github.com/dojyorin/deno_simple_ipc/actions/workflows/test.yaml/badge.svg)
![Actions-Release](https://github.com/dojyorin/deno_simple_ipc/actions/workflows/release.yaml/badge.svg)

The simple and lightweight module that wraps `Deno.listen()` and `Deno.connect()` for basic inter-process communication (IPC) in Deno.

# Example
**Server**

```ts
const ipc = listenUdsRequest("example_channel", (data:string)=>{
    console.log(data); // => "request-foo"
    return "response-bar";
});
```

**Client**

```ts
const response = await postUdsRequest<string, string>("example_channel", "request-foo");
console.log(response); // => "response-bar"
```

This module is for Deno, it's actually socket communication, so it's compatible with processes on a variety of platforms.

# Details
With Deno's feature, you can choose between two communication methods.

- TCP/IP Socket
- Unix Socket

## TCP/IP Socket
As for the general TCP/IP method, this can be done by listening to a port on localhost `127.0.0.1`.

Unlike Unix Socket, which is described later, this is a better option because it can be used regardless of platform.

However UnixSocket is often faster in terms of performance.

## Unix Socket
Unix method on the other hand, are a bit special, and cannot be used unless Deno's `--unstable` flag is enabled.

I hope it will be "stable".

Also the platform is only availables with Linux and Mac, not Windows.

This is not Deno's problem, but because the Rust library "tokio-rs/mio" that Deno uses internally does not support "AF_UNIX" on Windows.

Windows itself supports "AF_UNIX" in 10 insider build 17063, and a pull request has been submitted for support in "mio", so it may be possible to use it in Deno soon.

Reference: https://github.com/tokio-rs/mio/pull/1610

The path of the socket file is temporary directory `/tmp/.${channel_string}.sock`.

Also as mentioned above temporary directory `C:/Windows/Temp` is already defined for Windows in consideration of the possibility that Windows will be supported in the future.

# API
See [Deno Document](https://deno.land/x/simple_ipc/mod.ts) for details.