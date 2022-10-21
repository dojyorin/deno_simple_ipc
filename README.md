# **Simple IPC for Deno**
![Actions-Test](https://github.com/dojyorin/deno_simple_ipc/actions/workflows/test.yaml/badge.svg?branch=master)

# UnixSocket

# API
<details>
<summary>Open</summary>

## `listenIpRequest(ch, onMessage)`
**Arguments**
- `ch`
- `onMessage`

**Returns**
- void

## `listenIpBroadcast(ch, onMessage)`
**Arguments**
- `ch`
- `onMessage`

**Returns**
- void

## `postIpRequest(ch, data)`
**Arguments**
- `ch`
- `data`

**Returns**
- response data

## `postIpBroadcast(ch, data)`
**Arguments**
- `ch`
- `data`

**Returns**
- void

## `listenUdsRequest(ch, onMessage)`
**Arguments**
- `ch`
- `onMessage`

**Returns**
- void

**Notes**
- Important! - no support windows

## `listenUdsBroadcast(ch, onMessage)`
**Arguments**
- `ch`
- `onMessage`

**Returns**
- void

**Notes**
- Important! - no support windows

## `postUdsRequest(ch, data)`
**Arguments**
- `ch`
- `data`

**Returns**
- response data

**Notes**
- Important! - no support windows

## `postUdsBroadcast(ch, data)`
**Arguments**
- `ch`
- `data`

**Returns**
- void

**Notes**
- Important! - no support windows

</details>