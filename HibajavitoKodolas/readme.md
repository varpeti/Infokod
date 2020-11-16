# Hibajavító Kódolás

**Feladat**

"Írjon szimulációt, mely szimulálja a csatornaátvitelt és a hibajavító kódolást.
A szimuláció menete, hogy egy véletlenszerűen generált u vektort kódoljon a program, adjon hozzá egy véletlenszerűen (állítható eloszlással) generált hibavektort, majd a vételi oldalon a vett vektor alapján detektálja a hibát, és dekódoljon.
Az egyes lépések láthatóak és elkülöníthetőek legyenek a program futása során! (Jelenjen meg u, c, e, v, e’, u’)
A kész szimulációval teljesítőképesség analízist is kell készíteni (= grafikonok pl. csatorna P_b hibavalószínűségének függvényében a helyesen átvitt üzenetek száma), és azokat szövegesen is ki kell értékelni.
Implementálandó kódok: Ismétléses kód implementálása, Bináris (GF(2)) és GF(q) Hamming kód implementálása (paraméterben kérje be q-t, n-t, generáljon hozzá k-t, írja is ki őket)"

---


## Kódolási eljárások

### Redundáns (ismétléses) kódolás

#### Redundáns x2

##### Kódolás:
A ```u``` mögé írjuk a másolatát még egyszer.
```
c = u.repeate(2);
```

##### Hiba felismerés:
Az üzenetet elfelezzük, és összehasonlítjuk őket, bitenként.
- Ha megegyeznek, akkor [nics hiba](index.html?input=Ελληνικά&u=phqjqjqfqlqhqiq4&q=36&eljaras=1&e=0), (vagy [két egyforma hiba van](index.html?input=abc&u=5c5d5e&q=17&eljaras=1&e=000e00000e00) ), ekkor kiírjuk a bitet,
- Ha nem egyeznek meg akkor nem tudjuk eldönteni, ez [egyik helyes-e](index.html?input=Lap&u=485c6a&q=17&eljaras=1&e=030000000000) (és melyik), vagy [mindkettő rossz](index.html?input=Lap&u=485c6a&q=17&eljaras=1&e=0200000g0000). Ilyenkor "?" írunk
```
    parts = v.splitInto(2);

    compareParts(parts)
        .ifEqual(   bit -> u' += bit)
        .ifNotEqual(bit -> u' += "?");
```


##### Dekódolás:
Elhagyjuk a második felét.

#### Redundáns x3

##### Kódolás:
A ```u``` mögé írjuk a másolatát még kétszer.
```
c = u.repeate(3);
```

##### Hiba felismerés, javítás:
Az üzenetet elharmadoljuk, és összehasonlítjuk őket, bitenként.
- Ha megegyeznek, akkor [nincs hiba](index.html?input=A&u=41&q=16&eljaras=2&e=000000), (vagy [három egyforma hiba van](index.html?input=A&u=41&q=16&eljaras=2&e=0a0a0a)), ekkor kiírjuk a bitet, 
- Ha a 2 megegyezik, akkor [egy hiba van](index.html?input=A&u=41&q=16&eljaras=2&e=000a00), (vagy [két egyforma hiba van](index.html?input=A&u=41&q=16&eljaras=2&e=000a0a)), ekkor kiírjuk ez egyező biteket,
- Ha mind 3 különbözik, akkor [3 hiba van](index.html?input=A&u=41&q=16&eljaras=2&e=ff0023), nem tudunk javítani "?"-et írunk.

##### Dekódolás:
Elhagyjuk a második 2/3-át.

#### Általánosítva

##### Kódolás:
```javascript
c.setValue(u.getValue().repeat(x)); // x - a redundancia mértéke
```

##### Dekódolás:
```javascript

red(v,u2,x); // x - a redundancia mértéke

//Összemergeli a kapott mátrix értékeit soronként, úgy megszámolja a egyezések számát, és amelyik érték több az lesz az érték, egyezés esetén '?';
const merger = (arr) =>
{   
    if (arr.length===0) return;

    let ret = "";
    for (var i = 0; i < arr[0].length; i++) 
    {   
        //Megszámoljuk melyikből mennyi van
        const values = {};
        for (j in arr) for (let k = j; k < arr.length; k++)
        {
            if (j===k) continue;
            //console.log(arr[k][i],arr[j][i])
            if (arr[k][i] === arr[j][i]) 
            {
                if (!(arr[k][i] in values)) values[arr[k][i]]=0;
                values[arr[k][i]]++;
            }
        }
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
```

### Bináris Hamming kód (Egy dinamikusan növő blokkal)

#### Az oroszlán keresés a sivatagban-tól az üzenet kódolásig.

*Ebben a fejezetben szemléltetem, hogy milyen tudással rendelkeztem a Hamming kódolással kapcsolatban korábban, szándékosan kerülöm az exact matematikai megfogalmazásokat*

Amikor először találkoztam Hamming kóddal, akkor úgy ismertem meg mint egy nagy bináris n*n-es mátrix amiben vannak kijelölt helyek, amik képesek megmondani ha megváltozik a mátrix értéke valahol.

Példa: 
```
Van egy 4x4-es mátrixom:
c =
     0 (1)(0) 0
    (0) 0  0  0
    (0) 1  0  1
     0  1  1  0
Ha ebben bárhol megváltoztatok, egy bitet, akkor képes vagyok visszaállítani az eredetit. (6. bitet változtattam meg, avagy a 3. oszlop 2. sor át.)

v =
     0 (1)(0) 0
    (0) 0  1  0
    (0) 1  0  1
     0  1  1  0


Hogy hogyan? Kérdésekkel: 
Elfelezzük a mátrix számos módon és megszámoljuk az 1-esek számát, ha páratlan abban a felében lesz a hiba.

        v     v
     . (1)(.) 0
    (.) 0  .  0
    (.) 1  .  1
     .  1  .  0

    4 darab van, tehát a másik felébe lesz hiba
    lehetséges helyek:
     x  -  x  -
     x  -  x  -
     x  -  x  -
     x  -  x  -

           v  v
     . (.)(0) 0
    (.) .  1  0
    (.) .  0  1
     .  .  1  0

    3 darab van, tehát itt lesz hiba
    lehetséges helyek:
     -  -  x  -
     -  -  x  -
     -  -  x  -
     -  -  x  -

     . (.)(.) .
    (0) 0  1  0 <
    (.) .  .  . 
     0  1  1  0 <

    3 darab van, tehát itt lesz hiba
    lehetséges helyek:
     -  -  -  -
     -  -  x  -
     -  -  -  -
     -  -  x  -

     . (.)(.) .
    (.) .  .  .
    (0) 1  0  1 <
     0  1  1  0 <
    4 darab van, tehát a másik felébe lesz hiba
    lehetséges helyek:
     -  -  -  -
     -  -  x  -
     -  -  -  -
     -  -  -  -

    Ezt a módszert logaritmikus keresésnek, diáknyelven "oroszlán keresése a sivatagban"-nak hívjuk.
```

Ez szép, és jó, de nem akarunk ilyen kérdezgetés meg mátrix felezgetéseket lekódolni, mert macerás. Ezzel el is jutunk oda, hogy:

**Miért vannak zárójelekbe egyes bitek?**

```
Vegyük a mátrixot úgy mintha egy sorozat lenne, és nézzük meg minden indexének a bináris értékét:
     0000 (0001)(0010) 0011
    (0100) 0101  0110  0111
    (1000) 1001  1010  1011
     1100  1101  1110  1111

Mint láthatjuk a zárójelbe lévő indexek csak egy darab 1-est tartalmaznak (az-az bázist alkotnak), így segítségükkel bármilyen koordinátát meg tudunk "címezni":

Pl:
 0*0001 + 1*0010 + 1*0100 + 0*1000 = 0110

Ezek a bitek "elfelezik" a mátrixot, rendre pont úgy mint a fentebbi kérdezgetős példában.

```

Most térjünk el egy kicsit, nézzük meg az eredeti mátrixot:

```
c =
     0 (1)(0) 0 |  0000 (0001)(0010) 0011
    (0) 0  0  0 | (0100) 0101  0110  0111
    (0) 1  0  1 | (1000) 1001  1010  1011
     0  1  1  0 |  1100  1101  1110  1111

Adjuk össze az összes 1-es biteknek a koordinátáit bitenként:

    0001
    1001
    1011
    1101
   +1110
   -----
    0000 (<- Ez hívjuk paritásnak)

Most nézzük meg az elrontott mátrixot:

v =
     0 (1)(0) 0 |  0000 (0001)(0010) 0011
    (0) 0  1  0 | (0100) 0101  0110  0111
    (0) 1  0  1 | (1000) 1001  1010  1011
     0  1  1  0 |  1100  1101  1110  1111

    0001
    1001
    0110 (<- ez jött hozzá pluszba)
    1011
    1101
   +1110
   -----
    0110

Az eredeti mátrix 0000 volt, így bármelyik bit megváltozik, (akár 0->1, akár 1->0) akkor rögtön kijön a hiba helye. Ez a bináris összeadásnak köszönhető, ami megegyezik a bitwise XOR-al.

Példa 1->0-ra:

     0 (1)(0) 0 |  0000 (0001)(0010) 0011
    (0) 0  0  0 | (0100) 0101  0110  0111
    (0) 0  0  1 | (1000) 1001  1010  1011
     0  1  1  0 |  1100  1101  1110  1111

    0001
    1011
    1101
   +1110
   -----
    1001 (<- ezt vettük ki)
```

Kanyarodjunk vissza a zárójelekre:

**Hogyan tudjuk ezt felhasználni üzenet kódolásra?**
```
legyen az üzenetünk: "V"
Ez binárisan:

u = 01010110

Rakjuk bele egy 4x4-es mátrix aljába, úgy hogy a ()-ben lévő bitek maradjanak ki.

     ? (?)(?) ?
    (?) ?  ?  0 
    (?) 1  0  1 
     0  1  1  0

    Látható hogy van még hely, ezért az u-t egészítsük ki 4 darab 0-val:

u = 000001010110

     0 (?)(?) 0 |  0000 (0001)(0010) 0011
    (?) 0  0  0 | (0100) 0101  0110  0111 
    (?) 1  0  1 | (1000) 1001  1010  1011 
     0  1  1  0 |  1100  1101  1110  1111

    Adjuk össze az összes 1-es biteknek a koordinátáit bitenként:

     1001
     1011
     1101
    +1110
    -----
     0001 

    Ez nem 0, mi pedig 0-nak szeretnénk beállítani. Ehhez a fennmaradt (?) biteteket 0-ra vagy 1-re kell állítani:

    Az eredményt felbontjuk a 0*0001 + 0*0010 + 0*0100 + 1*1000 bázisra
    így meg is kapjuk melyik biteket kell állítani:

     0 (1)(0) 0
    (0) 0  0  0 
    (0) 1  0  1 
     0  1  1  0

paritás = 0000

Így ha bármely bit megváltozik, egyből tudjuk detektálni, és javítani, a fentebb bemutatott módon.

A dekódolás egyszerű: el kell hagyni a ()-es biteket.

u' = 0000 01010110

Üzenet: "V"

Megjegyzés 1:
    A paritás bitek a 2 hatványainak indexen helyezkednek el.

Megjegyzés 2: 
    0000-ás bit megváltozását nem detektáljuk, ezért ezt extra paritás bitként felhasználva, meg tudjuk állapítani, hogy több hiba történt-e. 

Megjegyzés 3:
    Az oroszlán keresős szemléletes, az utóbbi megközelítés pedig közel áll a hardveres megoldáshoz.

```

[A példa](index.html?input=V&&q=2&eljaras=3&e=0000010000000000)

#### Kódolás

Megállapítom, hogy mekkora az üzenet (```u.length```).
Ebből kiszámolom, hogy mekkora a Mátrix (blockSize), mennyi paritás bit van (numOfParityBit), és mekkora az üzenet mérete:
```
    blockSize = a legközelebbi felső 2 hatvány az [u hossza + log2(u hossza)] számhoz. // Így biztos belefér a paritás (log2-es rész) és az üzenet is.

    numOfParityBit = log2(blockSize); // mivel a 2 hatványain helyezkednek el a paritás bitek

    const messageSize = blockSize-numOfParityBit; // A lehetséges maximális üzenet hossz ebben a blokkban.
```

Összeadom az 1-es bitekhez tartozó bináris indexeket, így megkapom a paritást.
A paritás alapján beállítom a paritás vektorok értékét, így a kód paritás 0-lesz.

A kód:
```javascript
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
```

#### Hiba felismerés, javítás:

Összeadom az 1-es bitekhez tartozó bináris indexeket, így megkapom a paritást.
- Ha a paritás 0, akkor nincs hiba, [v a kódszó](index.html?input=ABC&u=010000010100001001000011&q=2&eljaras=3&e=0), vagy annyi hiba történt, hogy [v egy másik kódszó](index.html?input=ABC&u=010000010100001001000011&q=2&eljaras=3&e=00001000100000001000000000000111).
- Ha a paritás nem 0 akkor, [egy](index.html?input=ABC&u=010000010100001001000011&q=2&eljaras=3&e=100), vagy [több](index.html?input=ABC&u=010000010100001001000011&q=2&eljaras=3&e=11111110000) hiba történt, tehát v nem kódszó, meg kell keresni a hozzá legközelebbi kódszót. Javítás: a paritás megadja azt az indexet, ahol meg kell forgatni a bit-et.

#### Dekódolás:
Elhagyjuk a paritás biteket.

A kód:
```javascript
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
```


### GF(q) (n,n-2) Hamming kód (Egy fix hosszú kóddal)

#### Háttér
*Ebben a részben matematikusabb oldalról közelítem meg a problémát, így sokat idézek a Györfi László, Győri Sándor, Vajda István által 2002-ben kiadott Információ- és kódelmélet c. könyvéből.*

```
    [forrás]-u->[kódoló]-c->[csatorna]-v->[dekódoló]-u'->[nyelő]
```

A hibajavító kódolás alapvető módszereit a fentebbi ábrán látható egyszerű hírközlési struktúra kapcsán vizsgáljuk.
Az u és u' vektorok koordinátái egy F halmazból veszik értékeiket, mely halmazt **forrásábécének** nevezzük. A kódoló a k hosszú u vektort (az üzenetet) egy n hosszú c vektorba (a **kódszóba**) képezi le. A c koordinátái egy Q halmazból veszik értékeiket. A Q-t **kódábécének** fogjuk
hívni. A csatorna kimenete v, szintén egy n hosszú vektor, melynek koordinátái
szintén Q-beliek.

Az mondjuk hogy a csatorna hibázott az m időpontban ha 
```
    c[m] != v[m]
```

A d(c,v)-t a c,v sorozatok **Hamming távolságnak** hívjuk.

Egyszerű hibázás: A hiba helye és értéke ismeretlen.

Hibák száma:
```
    t = d(c,v)
```

*Kód* alatt a Q**n halmaz egy C részhalmazát értjük, azaz C minden
eleme egy n hosszú vektor, melynek koordinátái Q-beliek. C elemeit **kódszavaknak nevezzük**.

**Kódtávolság**
```
    dmin = min d(c,c')

    ahol
        c!=c'
        c,c' C-beli
```

A **kódolás** egy invertálható függvény, mely k hosszú F-beli
sorozatot (üzenetet) képez le egy kódszóba:
```
    f: F**k -> C
```
és minden különböző u, u' -re f(u), f(u') is különböző.

**Dekódolás** alatt két függvény egymásutánját értjük. Az egyik a csatorna kimenetének n hosszú szegmensét képezi le C-be, azaz igyekszünk eltalálni a küldött kódszót, ezt úgy csináljuk, hogy v vektorhoz megkeressük azt a c' C-beli kódszót, mely Hamming-távolság szerint hozzá a legközelebb van. A másik pedig az f függvény inverze (f**-1).


**Generátor mátrix (G)**:

A g[1]..g[k] C-beli vektorok a C lineáris tér egy bázisát alkotják,
ha lineárisan függetlenek, továbbá igaz az, hogy minden c C-beli vektor előállítható
```
         k
    c = SUM(u[i]*g[i])
        i=1
```
alakban, ahol u[i] eleme {0,1} minden i=1,2...k-ra.

Az egyenlőség mátrix alakba:
```
    c = uG

    ahol 
        u = u[1]..u[k]
        G bázis vektorokból mint sorvektorokból álló mátrix.
```


Egy (n,k) paraméterű lineáris kód **szisztematikus**, ha minden kódszavára igaz, hogy annak utolsó n-k szimbólumát elhagyva éppen a neki megfelelő k hosszúságú üzenetet kapjuk, más szavakkal a k hosszú üzenetet egészítjük ki n-k karakterrel.

Szisztematikus kód esetén a generátormátrix egyértelmű.

**Paritás mátrix (H)**

Ha egy n-k sorból és n oszlopból álló H mátrixra igaz az hogy:
```
    H*trans(c) = 0
```
akkor és csak akkor ha c C-beli, akkor H-t a C paritás ellenőrző mátrixának nevezzük.

**H** segítségével tehát meg tudjuk állapítani, hogy egy vett szó valóban kódszó-e.

Ha **G** és **H** ugyanazon C lineáris kód generátormátrixa illetve paritás-mátrixa, akkor
```
    H*trans(G) = 0
```
Minden lineáris kódnak van paritásmátrixa.

**Szindróma (s)**
```
    s = e*trans(H)

    ahol
        e = v-c hibavektor
```

A szindróma értéke, csakis a hibavektortól függ.
```
    H*trans(v) = H*trans(c+e) = H*tras(c) + H*trans(e) = H*trans(e)
```

A dekódolás leggyakoribb módja a szindróma dekódolás. A fentiek alapján
a dekódolás a következőképpen mehet végbe: a vett v szóból kiszámítjuk az 
```
trans(s) = H* trans(v) = H*trans(e) 
```
szindrómát, ennek alapján megbecsüljük a hibavektort, és ezt v-ből levonva megkapjuk a kódszóra vonatkozó becslésünket.

**Becslés:** 

Úgy szeretnénk megváltoztatni a v-t (minél kevesebb változtatással), hogy a 
```
    H*trans(v) = 0
```
legyen.

Ha v-ben megnöveljük az i. koordinátát j konstanssal, akkor az eredmény:
```
    H[i]*j-vel nő, ahol H[i] a H mátrix oszlopa.
```

Tehát, ha van olyan H oszlop, aminek a j-szerese == H*trans(v), akkor v i. koordinátájához (-j)-t adva kódszót kapunk.


**GF(q)**

Egy q elemszámú G testet véges testnek nevezünk és GF(q)-val jelöljük.

Egy GF(q) esetén q = p**m alakú, ahol p prímszám, tehát q vagy prímszám, vagy prímhatvány.

*(Lényeges különbség van a prím és a prímhatvány méretű véges testek aritmetikája között. Most a prímszám méretű véges testekkel foglalkozom, tehát q prímszám a továbbiakban.)*

**Primitív elem**

Minden GF(q)-ban létezik primitív elem.

Primitív elem az, amelyet hatványozva az összes elem előáll a 0-át leszámítva.

Gyakorlatban: Ha egy elemet 1-től hatványozva eljutunk 1-ig, és az előállított elemek száma q-1 akkor az primitív elem. 

**(n,n-2) Hamming kód**

A maximális hosszúságú nem-bináris Hamming-kód perfekt kód.

A nem-bináris Hamming-kódok közül különösen érdekes az az eset, amikor a kód szisztematikus és a paritásszegmens hossza 2, azaz n k = 2. Legyen o
a GF(q) egy nem 0 eleme, melynek rendje m >= 2. Válasszunk n <= (m+2)-t és
k = (n-2)-t. Ekkor a paritásmátrix:
```
    H = 
    [
        [1,1,1,    ...        1,  1,0],
        [1,o,o**2, ... o**(n-3),  0,1]
    ]
```
Ez egy (n,n-2) paraméterű nem-bináris Hamming-kód paritásmátrixa.

A ```H trans(G) = 0``` tétel segítségével megkapjuk a Generátor mátrixot is:

```
    G =
    [
        [1,0,0 ... 0, -1,-1       ],
        [0,1,0 ... 0, -1,-o       ],
        [0,0,1 ... 0, -1,-o**2    ],
        [|      \      |   |      ],
        [0,0,0 ... 1, -1,-o**(n-3)]
    ]
```

Mivel ez a kód 1 hibát tud javítani, ezért ```dmin>=3```, de a Singleton-korlát miatt ```dmin <= n-k+1 = 3```, ezért az (n,n-2) paraméterű nem-bináris Hamming-kód MDS kód.


#### Kézi példa

```
 q=3 k=3 n=5 Hamming kódra

    Megnézzük, hogy q prím-e? Prím.
    Megkeressük a GF(q)-ban a primitív elemet:
    elem    | hatványok    | rend
    1       | 1            | 1
    2       | 1 2          | 2 (primitív)

    Ebből felírjuk a paritás mátrixot:
    H = 
    [
        [1,1,1,0], // 1 1 .. 1 0
        [1,2,0,1], // primitív elem hatványok .. 0 1
    ];
    
    Felírjuk a generátor mátrixot:
    G = 
    [
        [1,0,mod(-1*1,q),mod(-1*1,q)],
        [0,1,mod(-1*1,q),mod(-1*2,q)],
    ] =
    [
        [1,0,2,2],
        [0,1,2,1],
    ];

    u = [[0,2]]

    c = u*G = [0,2, 1,2]

    e = [0,2,0,0,0]

    v = e+c = [0,1, 1,2]

    H*t(v) = [[2],[1]]

    Megkeressük azt a H oszlopot (error_index) amit megszorozva error_scale-el (mod q) egyenlő a H*t(v)-vel;
    error_scale*H[error_index] mod 3 == H*t(v) == [[2],[1]]
    error_index = 1 //Második oszlop
    error_scale = 2 //Eltérés mértéke 2

    Kijavítjuk:
    [0,1-error_scale mod q,1,2] == [0,2,1,2]

    Majd elhagyjuk a paritás biteket (az utolsó 2-őt)
    u' = [0,2]

}
```
[A példa](index.html?input=&u=02&q=3&eljaras=4&e=0200)

#### A megvalósítás

##### A GF(q) primitív elemének keresése, és a ```H``` és ```G``` mátrixok generálása

```javascript
const generate_H_G = (q) =>
{
    //Primitív elem keresés, előfeltétele, hogy q prím
    let down = [];
    for (var elem = 1; elem < q; elem++) 
    {
        let hatvanyok = [];
        let kitevo = 0;

        while(1)
        {
            let hatvany = mod(elem**kitevo,q);
            if (kitevo>0 && hatvany===1) break;
            hatvanyok.push(hatvany);
            
            kitevo++;
        }

        if (hatvanyok.length===q-1) {down=hatvanyok; break;} //Megan a primitív elem (rendje q-1)
    }
    //console.log(down);

    let up = new Array(down.length).fill(1);
      up.push(1);   up.push(0);
    down.push(0); down.push(1);

    H = [up,down];

    document.getElementById("H").value = mToString(H,q);

    G = [];
    for (let y = 0; y < down.length-2; y++) 
    {
        G[y] = [];
        for (let x = 0; x < down.length; x++)
        {
            if (x<down.length-2) //Egység mátrix
            {
                if (x===y) G[y][x]=1; 
                else       G[y][x]=0;
            }
            else
            {
                if (down.length-x===2) G[y][x]=mod(-1*up[y], q);
                else           /*===1*/G[y][x]=mod(-1*down[y],q);
            }
            
        }
    }

    document.getElementById("G").value = mToString(G,q);
}
```

##### Kódolás

```javascript
const hamming_encode = (u,q) =>
{
    u = str2num(u,q);
    return num2str(matrixDot(u,G,q)[0],q);
}
```

##### Hibajavítás és Dekódolás
```javascript
const hamming_decode = (v,q) =>
{
    v = transpose(str2num(v,q));
    let p = matrixDot(H,v,q);
    
    document.getElementById('parity2').value = p.toString(q).replaceAll(',','');


    //Javítás: megkeressük az indexet, és a legközelebbi kódszótól való eltérés mértékét.
    if (p.toString(q).replaceAll(',','').replaceAll('0','').length!==0)
    {
        let th = transpose(H);
        let ts = transpose(p)[0];
        let error = {index:0,scale:q};
        for (let error_index = 0; error_index < th.length; error_index++)
            for (var error_scale = 0; error_scale < q; error_scale++)
                if (isEqualVectors(vectorScalar(th[error_index],error_scale,q),ts)) 
                {
                    //console.log(error_index,error_scale);
                    if (error.scale > error_scale)
                        error = {index:error_index,scale:error_scale};
                }
        let correct_value = mod(v[error.index]-error.scale,q);
        document.getElementById('error_index').value = error.index;
        document.getElementById('error_scale').value = error.scale;
        v[error.index] = [correct_value];
    }

    
    //Stringé alakítjuk
    let ret = "";
    for (i in v) ret += v[i][0].toString(q);
    
    return ret.substr(0,ret.length-2); //Dekódolás: elhagyjuk a paritás biteket (utolsó 2 bitet)

}
```


- Ha a paritás 0, akkor nincs hiba, [v a kódszó](index.html?input=A q %3D 17&u=3e1f6b1f3a1f2f34&q=17&eljaras=4&e=0), vagy annyi hiba történt, hogy [v egy másik kódszó](index.html?input=ABC&u=005a060061&q=11&eljaras=4&e=0000000001a5).
- Ha a paritás nem 0 akkor, [egy](index.html?input=()&u=055056&q=7&eljaras=4&e=00006000), vagy [több](index.html?input=%40&u=0224&q=5&eljaras=4&e=010400) hiba történt, tehát v nem kódszó, meg kell keresni a hozzá legközelebbi kódszót. Javítás: Megkeressük azt a H oszlopot (error_index) amit megszorozva error_scale-el (mod q) egyenlő a H*t(v)-vel.