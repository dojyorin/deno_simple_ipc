# **Simple IPC for Deno**
![Actions-Test](https://github.com/dojyorin/deno_simple_ipc/actions/workflows/test.yaml/badge.svg?branch=master)

The thin library that wraps `Deno.listen()` and `Deno.connect()` for basic inter-process communication (IPC) in Deno.

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

**Client (.NET)**

```cs
using System;
using System.Text;
using System.Net.Sockets;
using System.Threading.Tasks;

using var socket = new Socket(AddressFamily.Unix, SocketType.Stream, ProtocolType.IP);

// "Simple IPC" default socket path is "/tmp/.deno.${channel}.socket"
socket.Connect(new UnixDomainSocketEndPoint("/tmp/.deno.example_channel.socket"));

Task.Run(async()=>{
    var buf = new byte[65536];

    while(true){
        var n = await socket.ReceiveAsync(buf, SocketFlags.None);
        await Console.Out.WriteAsync(Encoding.UTF8.GetString(buf, 0, n));
    }
});

Task.Run(async()=>{
    while(true){
        await socket.SendAsync(Encoding.UTF8.GetBytes("request-foo"), SocketFlags.None);
        await Task.Delay(3000);
    }
});
```

You can communicate with processes on various platforms, not just Deno.

# Details
With Deno's feature, you can choose between two communication methods.

- TCP/IP Socket
- Unix Socket

## TCP/IP Socket
As for the general TCP/IP method, this can be done by listening to a port on localhost `127.0.0.1`.

Unlike Unix Socket, which is described later, this is a better option because it can be used regardless of platform.

However, UnixSocket is often faster in terms of performance.

## Unix Socket
Unix method on the other hand, are a bit special, and cannot be used unless Deno's `--unstable` flag is enabled.

I hope it will be "stabilized".

Also, the platform is only compatible with Linux/Mac, not Windows.

This is not Deno's problem, but because the Rust library "tokio-rs/mio" that Deno uses internally does not support "AF_UNIX" on Windows.

Windows itself supports "AF_UNIX" in 10 insider build 17063, and a pull request has been submitted for support in "mio", so it may be possible to use it in Deno soon.

Reference: https://github.com/tokio-rs/mio/pull/1610

The path of the socket file is `/tmp/.deno.${channel}.socket`.

In addition, considering the possibility of future Windows as mentioned above, `C:/Windows/Temp` is also reserved for Windows.

# API
This library export the following APIs.

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
- Not support on Windows

## `void listenUdsBroadcast(ch, onMessage)`
- `ch` ... Communication channel string.
- `onMessage` ... Callback when a request is received from a client.

**Notes**
- Not support on Windows

## `postUdsRequest(ch, data)`
- `ch` ... Communication channel string.
- `data` ... Data to send to the server.
- `return` ... Response data from server.

**Notes**
- Not support on Windows

## `void postUdsBroadcast(ch, data)`
- `ch` ... Communication channel string.
- `data` ... Data to send to the server.

**Notes**
- Not support on Windows