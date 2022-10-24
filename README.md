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

Also the platform is only compatible with Linux/Mac, not Windows.

This is not Deno's problem, but because the Rust library "tokio-rs/mio" that Deno uses internally does not support "AF_UNIX" on Windows.

Windows itself supports "AF_UNIX" in 10 insider build 17063, and a pull request has been submitted for support in "mio", so it may be possible to use it in Deno soon.

Reference: https://github.com/tokio-rs/mio/pull/1610

The path of the socket file is temporary directory `/tmp/.deno.${channel}.socket`.

Also as mentioned above temporary directory `C:/Windows/Temp` is already defined for Windows in consideration of the possibility that Windows will be supported in the future.

# API
This module export the following APIs.

## `void listenIpRequest(ch, onMessage)`
- `ch` ... Communication channel port number.
- `onMessage` ... Callback when a request is received from a client. Requires response data to the client as a return value.

## `void listenIpBroadcast(ch, onMessage)`
- `ch` ... Communication channel port number.
- `onMessage` ... Callback when a request is received from a client.

## `postIpRequest(ch, data)`
- `ch` ... Communication channel port number.
- `data` ... Data to send to the server.
- `return` ... Response data from server.

## `void postIpBroadcast(ch, data)`
- `ch` ... Communication channel port number.
- `data` ... Data to send to the server.

## `void listenUdsRequest(ch, onMessage)`
- `ch` ... Communication channel string.
- `onMessage` ... Callback when a request is received from a client. Requires response data to the client as a return value.

**Notes**
- Windows is not support.

## `void listenUdsBroadcast(ch, onMessage)`
- `ch` ... Communication channel string.
- `onMessage` ... Callback when a request is received from a client.

**Notes**
- Windows is not support.

## `postUdsRequest(ch, data)`
- `ch` ... Communication channel string.
- `data` ... Data to send to the server.
- `return` ... Response data from server.

**Notes**
- Windows is not support.

## `void postUdsBroadcast(ch, data)`
- `ch` ... Communication channel string.
- `data` ... Data to send to the server.

**Notes**
- Windows is not support.