const ctx  = document.getElementById('canvas');
const log  = console.log;

class Signal
{
    constructor(elementID) 
    {
        this._element = document.getElementById(elementID);
    }
    setValue = (value) => {this._value = value;}
    getValue = () => {return this._value;}
    toString = () => {return this.getValue();}
    updateHTMLValue = (charLength) => 
    {
        let theHTMLValue = this._value;
        const offset = theHTMLValue.length%charLength;
        for (var i = 0; i < (theHTMLValue.length/charLength); i++)
            theHTMLValue = insertAt(theHTMLValue,(i)*charLength+i+offset,"\n");

        this._element.value = theHTMLValue;
    };
    updateHTMLValueHamming = (charLength) => 
    {
        let theHTMLValue = this._value;

        let theHTMLValueHamming = "";
        for (let i in theHTMLValue)
        {
            let lbi = logBase(2,i);
            if ( Math.floor(lbi)===lbi && i>0 ) 
                theHTMLValueHamming += "("+theHTMLValue[i]+")";
            else
                theHTMLValueHamming += " "+theHTMLValue[i]+" ";
        }

        for (var i = Math.ceil(theHTMLValueHamming.length/(3*charLength))-1; i >= 1; i--)
            theHTMLValueHamming = insertAt(theHTMLValueHamming,(i)*(3*charLength),"\n");


        this._element.value = theHTMLValueHamming;
    };
    setValueFromHTMLValue = () =>
    {
        this._value = this._element.value.replace(/([^0123456789abcdefABCDEF])/gm, "");
    }
    updateSize = () =>
    {
        this._element.style.height = 'auto';
        this._element.style.height = this._element.scrollHeight+'px';
        //M.textareaAutoResize(this._element);
    }
}

//Eh biztos van jobb megoldás mint a 2 hatványokra (v--; [v |= 2**i] v++;)
const roundUpSQR = (v) => { let i=1;while(v>i*i) i++; return i*i;}

//Legközelebbi 2 hatványra kerekít.
const roundUpPow2 = (v) => {v--; for (var i=0; i<10;i++) v|=v>>2**i; v++; return v;}

//Bázis alapú logaritmus
const logBase = (base, num) => {return Math.log(num) / Math.log(base);}

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
    if (num == null) num = 8;
    let ret = "";
    for (var i = 0; i < num; i++) 
    {
        ret += String.fromCharCode(Math.floor((Math.random()*(127-32)))+32);
    }
    return ret;
}

const add0 = (n,str) =>
{
    if (n<=str.length) return str;
    return "0".repeat(n-str.length)+str;
}

const XOR = (a,b,q) =>
{
    let ret = "";
    for (i in a) ret += ( parseInt(a[i],q) ^ parseInt(b[i],q) ).toString(q); //Bitwise XOR
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
    const c_v = document.getElementById('c').value.replace(/([\r\n ()])/gm, "");


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
    const c_v = document.getElementById('c').value.replace(/([\r\n ()])/gm, "");;
    const e_v = document.getElementById('e').value;
    hibas_bitek.value = ((e_v.split("1").length - 1)/c_v.length)*100;

    set_hibas_bitek_label();
}

const start = () =>
{   
    log("---");

    //Signalok
    const u  = new Signal('u' );
    const c  = new Signal('c' );
    const v  = new Signal('v' );
    const u2 = new Signal('u2');

    //Forrás
    const input      = document.getElementById('input').value;
    const qElement   = document.getElementById('q');
    if (qElement.value*1>16) qElement.value = "16"; else if (qElement.value*1<"2") qElement.value="2";
    const q          = qElement.value;
    const charLength = Math.ceil(logBase(q,256)); // Base 2-be = 8; 16-ba: 2;

    if (input && input !== "")
    {
        let val = "";
        for (var i = 0; i < input.length; i++)
            val+= add0(charLength,input[i].charCodeAt(0).toString(q));
        u.setValue(val);
        u.updateHTMLValue(charLength);
    }else
    {
        u.setValueFromHTMLValue();
    }

    //Kódoló
    document.getElementById('parity').value = "";
    const eljaras = document.getElementById('eljaras').value;

    switch (1*eljaras) 
    {
        case 1: //Redundáns x2
            c.setValue(u.getValue().repeat(2));
            c.updateHTMLValue(charLength);
            break;
        case 2: //Redundáns x3
            c.setValue(u.getValue().repeat(3));
            c.updateHTMLValue(charLength);
            break;
        case 3: //Hamming kód (1 dim block)

            if (q*1===2) c.setValue(binary_hamming_encode(u.getValue()));
            else         c.setValue(       hamming_encode(u.getValue(),q));
            c.updateHTMLValueHamming(charLength);
            break;
        case 4: //Hamming kód (több fix block) 
            c.setValue("TODO");
            break;
    }

    //Csatorna
    const e = new Signal('e');
    e.setValueFromHTMLValue();
    if (e.getValue().length > c.getValue().length) e.setValue("0"); //reset if its bigger
    e.setValue(add0(c.getValue().length,e.getValue()));
    e.updateHTMLValue(charLength);
    v.setValue(XOR(c.getValue(),e.getValue(),q));

    if (1*eljaras>2)
        v.updateHTMLValueHamming(charLength);
    else 
        v.updateHTMLValue(charLength);


    //Dekódoló
    document.getElementById('parity2').value = "";

    switch (1*eljaras) 
    {
        case 1: //Redundáns x2
            red(v,u2,2);
            break;
        case 2: //Redundáns x3
            red(v,u2,3);
            break;
        case 3: //Hamming kód (1 dim block)
            if (q*1===2) u2.setValue(binary_hamming_decode(v.getValue()));
            else         u2.setValue(       hamming_decode(v.getValue(),q));
            break;
        case 4: //Hamming kód (több fix block)
            break;
    }

    u2.updateHTMLValue(charLength);

    //Nyelő

    const output = document.getElementById('output');
    let out = "";
    for (var i = u2.getValue().length; i >= charLength; i-=charLength)
    {
        const char = u2.getValue().substring(i-charLength,i); //Only ASCII!!
        if (parseInt(char,q) !== 0) out += String.fromCharCode(parseInt(char,q));
    }
    output.value = out.split("").reverse().join(""); //Reverse

    

    //update/resize

    M.updateTextFields();
    u.updateSize(); c.updateSize(); v.updateSize(); u2.updateSize(); e.updateSize();

}

//Összemergeli a kapott mátrix értékeit soronként, úgy megszámolja a egyezések számát, és amelyik érték több az lesz az érték, egyezés esetén '?';
const merger = (arr) =>
{   
    let ret = "";
    for (var i = 0; i < arr[0].length; i++) 
    {   
        //Megszámoljuk melyikből mennyi van
        const values = {};
        for (j in arr) for (let k = j; k < arr.length; k++)
        {
            if (j===k) continue;
            console.log(arr[k][i],arr[j][i])
            if (arr[k][i] === arr[j][i]) 
            {
                if (!(arr[k][i] in values)) values[arr[k][i]]=0;
                values[arr[k][i]]++;
            }
        }

        console.log(values);

        //Kiválasszuk a legnagyobbat, ha két legnagyobb megegyezik "?"-et add vissza.
        let maxV = {j:"?",v:-1}
        for (j in values)
        {
            if (values[j]>maxV.v) {maxV.v=values[j]; maxV.j=j;}
            else if (values[j]===maxV.v) {maxV.j="?"}
        }

        ret+=""+maxV.j;
        
    }
    return ret;
}

const red = (v,u2,divident) =>
{
    const chunks = [];

    let vv = v.getValue();

    const d = Math.round(vv.length/divident);
    while(vv.length > 0) 
    {
        nextChunk = vv.substring(0,d);
        chunks.push(nextChunk);
        vv = vv.substring(d,vv.length);
    }

    u2.setValue(merger(chunks));
}

/* 
{

    Kézi példa (16)
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

    Kézi példa (32)
    0??0?000  | 00000 00001 00010 00011 00100 00101 00110 00111
    ?0000000  | 01000 01001 01010 01011 01100 01101 01110 01111
    ?0000000  | 10000 10001 10010 10011 10100 10101 10110 10111
    00000000  | 11000 11001 11010 11011 11100 11101 11110 11111

    Látható hogy a 2 hatványainál (?) az indexnek csak az egyik bitje 1-es, ezért ezek lesznek a paritás bitek
    Minden egyes paritás bit lefedi a felét a teljes kódnak.
    
    Példa:
    Az üzenet (27):
    000
    00000000
    10101010
    10101010
    
    Ekkor a kód paritás nélkül:
    0??0?000
    ?0000001
    ?0101010
    10101010
    
    Ekkor az 1-esek sorszáma:
    15, 18, 20, 22, 24, 26, 28, 30

    Binárisan: 
    01111
    10010
    10100
    10110
    11000
    11010
    11100
    11110

    Binary XOR (avagy oszloponkénti paritás):
    11111
    
    A kód (c) immár paritással:
    01101000
    10000001
    10101010
    10101010

    Ellenörzés:
    01111
    10010
    10100
    10110
    11000
    11010
    11100
    11110
    00001
    00010
    00100
    01000
    10000

    Egyesek száma az oszlopokban:
    86662

    Binary XOR (avagy oszloponkénti paritás):
    00000
}
*/

const binary_hamming_encode = (u) =>
{   
    // 2**numOfParityBit == blockSize
    const blockSize = roundUpPow2(u.length+Math.round(logBase(2,u.length))); //Megkeresi az ideális blokk méretet
    const numOfParityBit = logBase(2,blockSize);
    const messageSize = blockSize-numOfParityBit;

    let ret = add0(messageSize,u);

    let parity = "0".repeat(numOfParityBit);
    
    for (let i in parity) ret = insertAt(ret,2**i,'0'); //Minden 2 hatványa indexű szám a redundanciáért felel.
    
    for (var i = 0; i < blockSize; i++)
    {
        if (ret[i] !== '1') continue; // Ha 1 akkor 
        num = i.toString(2); num = add0(numOfParityBit,num); // az indexet numOfParityBit bites binárissá alakítom
        parity = XOR(parity,num,2); // És össze XOR-olom őket: paritását adja meg.
    }

    document.getElementById('parity').value = parity;

    //Beleírom az üzenetbe a paritás biteket, a helyükre. (hátulról előre)
    for (let i in parity) if (parity[parity.length-i-1] === '1') ret = replaceAt(ret,2**i,'1');
    
    return ret;
}

const binary_hamming_decode = (v) =>
{
    // 2**numOfParityBit == blockSize
    const blockSize = v.length;
    const numOfParityBit = logBase(2,blockSize);
    const messageSize = blockSize-numOfParityBit;

    let parity = "0".repeat(numOfParityBit);
    for (var i = 0; i < blockSize; i++) // Megvizsgálunk minden bitet
    {
        if (v[i] !== '1') continue; // Ha 1 akkor 
        num = i.toString(2); num = add0(numOfParityBit,num); // az indexet numOfParityBit bites binárissá alakítom
        parity = XOR(parity,num,2); // És össze XOR-olom őket: paritását adja meg.
    }

    document.getElementById('parity2').value = parity;

    let ret = v;
    let error_index = "";

    if (parity !== "0".repeat(numOfParityBit))
    {
        error_index = parseInt(parity,2); // A paritás megadja a hiba indexét.
        ret = replaceAt(ret,error_index,ret[error_index]==='0'?'1':'0'); //Javítás
    }
    document.getElementById('error_index').value = error_index;

    for (let i in parity) ret = removeAt(ret,2**(parity.length-i-1)); //Kiszedjük a paritásokat az üzenetből

    return ret;
}


const hamming_encode = (u,q) =>
{
    return "TODO";
}

const hamming_decode = (v,q) =>
{
    return "TODO";
}