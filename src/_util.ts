export function bitSet(is:boolean, n:number){
    return is ? (1 << n) : 0;
}

export function bitGet(flag:number, n:number){
    return !!(flag & (1 << n));
}

export function text2byte(data:string){
    return new TextEncoder().encode(data);
}

export function byte2text(data:Uint8Array){
    return new TextDecoder().decode(data);
}