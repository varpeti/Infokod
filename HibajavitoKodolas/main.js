const ctx  = document.getElementById('canvas');
const log  = console.log;

const replaceAt = (str, index, replacement) =>
{
    return str.substr(0, index) + replacement + str.substr(index + replacement.length);
}

const insertAt = function(str, index, insertment) 
{
    return str.slice(0, index) + insertment + str.slice(index);
};

const removeAt = (str, index) =>
{
    return str.slice(0, index) + str.slice(index+1, str.length)
}

const randomWord = (num) =>
{
    if (num == null) num = 12;
    let ret = "";
    for (var i = 0; i < num; i++) 
    {
        ret += ""+Math.floor((Math.random()*2));
    }
    return ret;
}

const add0 = (n,str) =>
{
    if (n<str.length) return str;
    return "0".repeat(n-str.length)+str;
}

const XOR = (a,b) =>
{
    let ret = "";
    for (i in a) ret += (a[i]===b[i] ? '0' : '1'); //Bitwise XOR
    return ret;
}

// NxN mátrixá alakítja ha lehet
const matrixify = (value) =>
{
    const sqr = Math.sqrt(value.length);
    let ret = value;
    if (Math.floor(sqr)===sqr)
        for (var i = Math.floor(sqr)-1; i >= 1; i--) 
            ret = insertAt(ret,(i)*sqr,"\r\n");
    return ret;
}

const set_hibas_bitek_label = () =>
{
    document.getElementById('l_hibas_bitek').innerText='Hibás bitek: '+document.getElementById('hibas_bitek').value+'%';
}

//Mint a való életben a hiba burst-ökben jelenik meg.
//Kiválaszt egy pontot és onnan minden bit hibás lesz.
const generate_e = () =>
{
    const hibas_bitek_szazaleka = document.getElementById('hibas_bitek').value;
    const e = document.getElementById('e');
    const c_v = document.getElementById('c').value.replace(/(\r\n|\n|\r)/gm, "");


    let ret = "0".repeat(c_v.length);

    let hbs = Math.floor(c_v.length/100*hibas_bitek_szazaleka);
    let bit = Math.floor((Math.random()*(c_v.length-hbs)));

    ret = replaceAt(ret, bit,"1".repeat(hbs));

    e.value = ret;
    set_hibas_bitek_label();
}

const generate_hibas_bitek_szazaleka = () =>
{
    const hibas_bitek = document.getElementById('hibas_bitek');
    const c_v = document.getElementById('c').value.replace(/(\r\n|\n|\r)/gm, "");;
    const e_v = document.getElementById('e').value;
    hibas_bitek.value = ((e_v.split("1").length - 1)/c_v.length)*100;

    set_hibas_bitek_label();
}

const start = () =>
{   
    log("---");

    //Forrás
    const u_v = document.getElementById('u').value;

    //Kódoló
    document.getElementById('parity').value = "";
    const eljaras = document.getElementById('eljaras').value;
    const c = document.getElementById('c');
    let c_v = "";

    switch (1*eljaras) 
    {
        case 1: //Redundáns x2
            c_v = u_v+u_v;
            break;
        case 2: //Redundáns x3
            c_v = u_v+u_v+u_v;
            break;
        case 3: //Hamming kód {m:16,r:4}
            c_v = hamming12_encode(u_v);
            break;
        case 4: //Bináris GF(q) Hamming kód
            c_v="TODO";
            break;
    }

    c.value = matrixify(c_v);

    //Csatorna
    const e = document.getElementById('e');
    const e_v = add0(c_v.length,e.value);
    const v_v = XOR(c_v,e_v);
    v.value = matrixify(v_v);

    // Ha négyzet szám, táblázatosan írjuk ki


    //Dekódoló és Nyelő

    const u2 = document.getElementById('u2');
    const u3 = document.getElementById('u3');
    document.getElementById('parity2').value = "";

    switch (1*eljaras) 
    {
        case 1: //Redundáns x2
            red(v_v,2,u2,u3);
            break;
        case 2: //Redundáns x3
            red(v_v,3,u2,u3);
            break;
        case 3:
            hamming12_decode(v_v,u2,u3);
            break;
        case 4: //Bináris GF(q) Hamming kód
            break;
    }

    M.updateTextFields();
    M.textareaAutoResize(c); M.textareaAutoResize(v);
}

//Összemergeli a kapott mátrix értékeit soronként, úgy megszámolja a egyezések számát, és amelyik érték több az lesz az érték, egyezés esetén '?';
const merger = (arr) =>
{   
    let ret = "";
    for (var i = 0; i < arr[0].length; i++) 
    {   
        const values = {0:0,1:0};
        for (j in arr) for (var k = j; k < arr.length; k++)
        {
            if (j===k) continue;
            if (arr[k][i] === arr[j][i]) values[arr[k][i]]++;
        }
        if      (values['0']>values['1']) ret+='0';
        else if (values['0']<values['1']) ret+='1';
        else ret+='?';
    }
    return ret;
}

const red = (v,divident,u2,u3) =>
{
    const chunks = [];

    const d = Math.round(v.length/divident);
    while(v.length > 0) 
    {
        nextChunk = v.substring(0,d);
        chunks.push(nextChunk);
        v = v.substring(d,v.length);
    }
    //log(chunks);

    u2.value = merger(chunks);
    if (u2.value.includes('?')) u3.value = "Hiba!";
    else u3.value = u2.value;
}

/* Kézi példa
    0??0  | 0000 0001 0010 0011
    ?000  | 0100 0101 0110 0111
    ?000  | 1000 1001 1010 1011
    0000  | 1100 1101 1110 1111

    Látható hogy a 2 hatványainál (?) az indexnek csak az egyik bitje 1-es, ezért ezek lesznek a paritás bitek
    Minden egyes paritás bit lefedi a felét a teljes kódnak.
    
    Példa:
    Az üzenet (u):
    101010101010
    
    Ekkor a kód paritás nélkül:
    1??0
    ?101
    ?010
    1010 
    
    Ekkor az 1-esek sorszáma:
    0, 5, 7, 10, 12, 14

    Binárisan: 
    0000
    0101
    0111
    1010
    1100
    1110

    Binary XOR (avagy oszloponkénti paritás):
    1010
    
    A kód (c) immár paritással:
    1010
    0101
    1010
    1010

    1010
    0101
    1010
    1010
*/

const hamming12_encode = (u_v) =>
{
    if (u_v.length>12) log(">12!");
    let c_v = add0(12,u_v);

    let parity = "0000";
    
    for (let i in parity) c_v = insertAt(c_v,2**i,'0'); //Minden 2 hatványa indexű szám a redundanciáért felel.
    
    for (var i = 0; i < 16; i++) 
    {
        if (c_v[i] !== '1') continue; // Ha 1 akkor 
        num = i.toString(2); num = add0(4,num); // az indexet 4 bites binárissá alakítom
        parity = XOR(parity,num); // És össze XOR-olom őket: paritását adja meg.
        //log(num);
    }

    document.getElementById('parity').value = parity;

    for (let i in parity) if (parity[parity.length-i-1] === '1') c_v = replaceAt(c_v,2**i,'1');
    //log(parity,c_v);
    return c_v;
}

const hamming12_decode = (v_v) =>
{
    if (v_v.length>16) log(">16!???");

    let parity = "0000";
    for (var i = 0; i < 16; i++) // Megvizsgálunk minden bitet
    {
        if (v_v[i] !== '1') continue; // Ha 1 akkor 
        num = i.toString(2); num = add0(4,num); // az indexet 4 bites binárissá alakítom
        parity = XOR(parity,num); // És össze XOR-olom őket: paritását adja meg.
    }

    document.getElementById('parity2').value = parity;

    u2_v = v_v;
    let error_index = "";

    if (parity !== "0000")
    {
        error_index = parseInt(parity,2); // A paritás megadja a hiba indexét.
        u2_v = replaceAt(v_v,error_index,v_v[error_index]==='0'?'1':'0'); //Javítás
    }
    document.getElementById('error_index').value = error_index;

    for (let i in parity) u2_v = removeAt(u2_v,2**(parity.length-i-1)); //Kiszedjük a paritásokat az üzenetből
    u2.value = u2_v;
    u3.value = u2_v;
}