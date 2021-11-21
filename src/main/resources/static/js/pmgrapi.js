"use strict"

/**
 * Librería de cliente para interaccionar con el servidor de Pmgr.
 * Prácticas de IU 2021-22
 *
 * Para las prácticas, por favor - NO TOQUES ESTE CÓDIGO.
 *
 * Fuera de las prácticas, lee la licencia: dice lo que puedes hacer con él:
 * lo que quieras siempre y cuando
 * - no digas que eres el autor original.
 * - no me eches la culpa de haberlo escrito mal.
 *
 * @Author manuel.freire@fdi.ucm.es
 */

/**
 * El estado global de la aplicación.
 */
class State {
    constructor(name, users, groups, movies, ratings, requests) {
        this.name = name;
        this.users = users || [];
        this.groups = groups || [];
        this.movies = movies || [];
        this.ratings = ratings || [];
        this.requests = requests || [];
    }
}

/**
 * Un usuario; requests y ratings contiene sólo IDs
 */
class User {
    constructor(id, username, password, role, groups, requests, ratings) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.role = role;
        this.groups = groups || [];
        this.requests = requests || [];
        this.ratings = ratings || [];
    }
}

/**
 * Una película; ratings contiene sólo IDs
 */
class Movie {
    constructor(id, imdb, name, director, actors, year, minutes, ratings) {
        this.id = id;
        this.imdb = imdb; // nota: en img/<imdb>.jpg tienes el póster (para el top-400)
        this.name = name;
        this.director = director;
        this.actors = actors;
        this.year = year;
        this.minutes = minutes;
        this.ratings = ratings || [];
    }
}

/**
 * Un grupo de usuarios; requests contiene sólo IDs
 */
class Group {
    constructor(id, name, owner, members, requests) {
        this.id = id;
        this.name = name;
        this.owner = owner;
        this.members = members || [];
        this.requests = requests || [];
    }
}

/**
 * Posibles estados de una request
 */
const RequestStatus = {
    AWAITING_GROUP: 'awaiting_group', // usuario pide ser invitado a grupo
    AWAITING_USER: 'awaiting_user', // grupo ofrece unirse a usuario
    ACCEPTED: 'accepted', // para aceptar una oferta
    REJECTED: 'rejected', // para rechazar una oferta
}

/**
 * Una petición de entrar en grupo
 */
class Request {
    constructor(id, user, group, status) {
        this.id = id;
        this.user = user;
        this.group = group;
        Util.checkEnum(status, RequestStatus);
        this.status = status;
    }
}

/**
 * Una valoración de una película
 */
class Rating {
    constructor(id, user, movie, rating, labels) {
        this.id = id;
        this.user = user;
        this.movie = movie;
        this.rating = rating; // -1 para "no sabe, no contesta", o entero entre 0 y 5
        this.labels = labels; // texto, separado por comas; "" para vacío
    }
}

/**
 * Utilidades
 */
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '01234567890';
class Util {

    /**
     * Escapes special characters to prevent XSS/breakage when generating HTML
     * via, say, insertAdjacentHTML or insertHTML.
     * 
     * (see https://stackoverflow.com/a/9756789/15472)
     */
    static escape(s) {
        return ('' + s) /* Forces the conversion to string. */
            .replace(/\\/g, '\\\\') /* This MUST be the 1st replacement. */
            .replace(/\t/g, '\\t') /* These 2 replacements protect whitespaces. */
            .replace(/\n/g, '\\n')
            .replace(/\u00A0/g, '\\u00A0') /* Useful but not absolutely necessary. */
            .replace(/&/g, '\\x26') /* These 5 replacements protect from HTML/XML. */
            .replace(/'/g, '\\x27')
            .replace(/"/g, '\\x22')
            .replace(/</g, '\\x3C')
            .replace(/>/g, '\\x3E');
    }

    /**
     * Quote attribute values to prevent XSS/breakage
     * 
     * (see https://stackoverflow.com/a/9756789/15472)
     */
    static quoteattr(s, preserveCR) {
        preserveCR = preserveCR ? '&#13;' : '\n';
        return ('' + s) /* Forces the conversion to string. */
            .replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
            .replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            /*
            You may add other replacements here for HTML only 
            (but it's not necessary).
            Or for XML, only if the named entities are defined in its DTD.
            */
            .replace(/\r\n/g, preserveCR) /* Must be before the next replacement. */
            .replace(/[\r\n]/g, preserveCR);;
    }

    /**
     * throws an error if value is not in an enum
     */
    static checkEnum(a, enumeration) {
        const valid = Object.values(enumeration);
        if (a === undefined) {
            return;
        }
        if (valid.indexOf(a) === -1) {
            throw Error(
                "Invalid enum value " + a +
                ", expected one of " + valid.join(", "));
        }
    }

    /**
     * Genera un entero aleatorio entre min y max, ambos inclusive
     * @param {Number} min 
     * @param {Number} max 
     */
    static randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    static randomChar(alphabet) {
        return alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }

    static randomString(count, alphabet) {
        const n = count || 5;
        const valid = alphabet || UPPER + LOWER + DIGITS;
        return new Array(n).fill('').map(() => this.randomChar(valid)).join('');
    }

    static randomPass() {
        const n = 7;
        const prefix = this.randomChar(UPPER) + this.randomChar(LOWER) + this.randomChar(DIGITS);
        const valid = UPPER + LOWER + DIGITS;
        return prefix + new Array(n - 3).fill('').map(() => this.randomChar(valid)).join('');
    }

    /**
     * Genera un identificador "unico" de 5 caracteres
     */
    static randomWord(count, capitalized) {
        return capitalized ?
            this.randomChar(UPPER) + this.randomString(count - 1, LOWER) :
            this.randomString(count, LOWER);
    }

    /**
     * Genera palabras al azar, de forma configurable
     */
    static randomText(wordCount, allCapitalized, delimiter) {
        let words = [this.randomWord(5, true)]; // primera empieza en mayusculas
        for (let i = 1; i < (wordCount || 1); i++) words.push(this.randomWord(5, allCapitalized));
        return words.join(delimiter || ' ');
    }

    /**
     * Devuelve algo al azar de un array
     */
    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Genera una fecha al azar entre 2 dadas
     * https://stackoverflow.com/a/19691491
     */
    static randomDate(fechaIni, maxDias) {
        let dia = new Date(fechaIni);
        dia.setDate(dia.getDate() - Util.randomInRange(1, maxDias));
        return dia;
    }

    /**
     * Devuelve n elementos no-duplicados de un array
     * de https://stackoverflow.com/a/11935263/15472
     */
    static randomSample(array, size) {
        var shuffled = array.slice(0),
            i = array.length,
            temp, index;
        while (i--) {
            index = Math.floor((i + 1) * Math.random());
            temp = shuffled[index];
            shuffled[index] = shuffled[i];
            shuffled[i] = temp;
        }
        return shuffled.slice(0, size);
    }

    /**
     * Genera hasta n parejas no-repetidas de elementos de dos arrays
     * los arrays deben ser numéricos (por ejemplo, IDs)
     */
    static randomPairs(count, as, bs) {
        const pairs = new Set();
        let retries = 0;
        while (pairs.size < count && retries < 100) {
            let p = `${Util.randomChoice(as)},${Util.randomChoice(bs)}`;
            if (pairs.has(p)) {
                retries++;
            } else {
                pairs.add(p);
            }
        }
        return Array.from(pairs).map(p => p.split(",").map(s => +s));
    }

    /**
     * Llena un array con el resultado de llamar a una funcion
     */
    static fill(count, f) {
        // new Array(count).map(f) fails: map only works on existing indices
        return new Array(count).fill().map(f)
    }

    // top-50 (x2) de nacidos en 2002 según https://www.ine.es
    static randomFirstNames = [
        "Alba", "Andrea", "Sara", "Ana",
        "Nerea", "Claudia", "Cristina", "Marina", "Elena", "Irene", "Natalia", "Carla",
        "Carmen", "Nuria", "Ainhoa", "Patricia", "Julia", "Angela", "Rocio", "Sandra",
        "Raquel", "Sofia", "Alicia", "Clara", "Noelia", "Miriam", "Alejandra", "Eva",
        "Isabel", "Silvia", "Celia", "Lorena", "Ines", "Beatriz", "Mireia", "Laia",
        "Lidia", "Carlota", "Blanca", "Ariadna", "Adriana", "Anna", "Carolina",
        "Monica", "Ana Maria", "Veronica",
        "Alejandro", "Pablo", "Daniel", "David", "Adrian", "Javier", "Alvaro", "Sergio",
        "Carlos", "Jorge", "Mario", "Raul", "Diego", "Manuel", "Miguel", "Ivan",
        "Antonio", "Juan", "Ruben", "Victor", "Alberto", "Jesus", "Marc", "Oscar",
        "Angel", "Francisco", "Jose", "Alex", "Marcos", "Jaime", "Ismael", "Luis",
        "Francisco Javier", "Miguel Angel", "Pedro", "Samuel", "Cristian", "Pau",
        "Andres", "Iker", "Jose Antonio", "Guillermo", "Ignacio", "Rafael", "Fernando",
        "Jose Manuel", "Nicolas", "Gonzalo", "Gabriel", "Hugo", "Joel"
    ];
    // top-100 nacionales, misma fuente
    static randomLastNames = [
        "Garcia", "Rodriguez", "Gonzalez", "Fernandez", "Lopez", "Martinez", "Sanchez",
        "Perez", "Gomez", "Martin", "Jimenez", "Hernandez", "Ruiz", "Diaz", "Moreno",
        "Muñoz", "Alvarez", "Romero", "Gutierrez", "Alonso", "Navarro", "Torres",
        "Dominguez", "Vazquez", "Ramos", "Ramirez", "Gil", "Serrano", "Molina", "Blanco",
        "Morales", "Suarez", "Ortega", "Castro", "Delgado", "Ortiz", "Marin", "Rubio",
        "Nuñez", "Sanz", "Medina", "Iglesias", "Castillo", "Cortes", "Garrido", "Santos",
        "Guerrero", "Lozano", "Cano", "Mendez", "Cruz", "Prieto", "Flores", "Herrera",
        "Peña", "Leon", "Marquez", "Gallego", "Cabrera", "Calvo", "Vidal", "Campos", "Vega",
        "Reyes", "Fuentes", "Carrasco", "Diez", "Caballero", "Aguilar", "Nieto", "Santana",
        "Pascual", "Herrero", "Montero", "Gimenez", "Hidalgo", "Lorenzo", "Vargas",
        "Ibañez", "Santiago", "Duran", "Benitez", "Ferrer", "Arias", "Mora", "Carmona",
        "Vicente", "Crespo", "Soto", "Roman", "Rojas", "Pastor", "Velasco", "Saez",
        "Parra", "Moya", "Bravo", "Soler", "Gallardo", "Esteban"
    ];

    // una lista de adjetivos; de https://www.ejemplos.co/
    static randomLabels = [
        "aburrido", "buenucho", "insulso", "amarillento", "cabezón", "inútil",
        "amarrete", "chiquilín", "lento", "aniñado", "desnutrido", "mentiroso", "avaro",
        "desvencijado", "miope", "barrigón", "dientudo", "orejón", "blancuzco",
        "estúpido", "paleto", "blandengue", "feucho", "petiso", "blanducho",
        "flacucho", "pueblerino", "bobo", "gordinflón", "santurrón", "bocón", "idiota",
        "sucio", "borracho", "ignorante", "zopenco", "acertado", "enorme", "optimista",
        "adaptable", "estupendo", "ordenado", "adecuado", "excepcional", "organizado",
        "ágil", "extraordinario", "orgulloso", "agradable", "fantástico", "orientado",
        "alegre", "feliz", "paciente", "amable", "fiel", "pacífico", "apto", "firme",
        "positivo", "atento", "genial", "preparado", "bondadoso", "gran",
        "productivo", "bueno", "grande", "protector", "capaz", "hábil", "prudente",
        "coherente", "hermoso", "puntual"
    ];

    /**
     * Genera un usuario al azar
     */
    static randomUser(id) {
        let username = Util.randomChoice(Util.randomFirstNames);
        username = username.replaceAll(/ /g, "").substring(0, 5) +
            '_' + Util.randomInRange(10, 99);
        return new User(
            id, username, Util.randomPass(), "USER"
        );
    }

    /**
     * Genera una película al azar
     */
    static randomMovie(id) {
        const first = () => Util.randomChoice(Util.randomFirstNames);
        const last = () => Util.randomChoice(Util.randomLastNames);
        const someone = () => `${first()} ${last()}`;
        const adjective = () => Util.randomChoice(Util.randomLabels);

        const titles = [
            `La vida de ${someone()}`,
            `El ${adjective()}, el ${adjective()} y el ${adjective()}`,
            `${last()} contra ${last()}`,
            `El ${adjective()} ${last()}`,
            `${first()} y ${first()}`
        ];

        return new Movie(
            id,
            `tt${Util.randomString(7, DIGITS)}`,
            Util.randomChoice(titles),
            someone(),
            Util.fill(Util.randomInRange(1, 4), someone).join(", "),
            Util.randomInRange(1950, 2021),
            Util.randomInRange(35, 240));
    }

    /**
     * Genera un grupo de usuarios. Cada posible integrante tiene un %
     * de ser incluido, pedir inclusión, o ser invitado
     * ojo - genera grupos que contienen Request de verdad, en lugar de sus IDs;
     *   esto permite enviarlos al servidor, pero hasta que esos Request sean 
     *   reemplazados por IDs, están malformados...
     */
    static randomGroup(id, users, pInclude, pInvite, pRequest) {
        const pre = Util.randomChoice(["Los", "Las", "Club"]);
        const post = Util.randomChoice(Util.randomLastNames);
        const owner = Util.randomChoice(users);
        const g = new Group(id, `${pre} ${post}`, owner.id);
        owner.groups.push(id);
        for (let p of users) {
            if (p.id == owner.id) continue;
            if (Util.randomInRange(0, 100) < pInclude) {
                g.members.push(p.id);
                p.groups.push(id);
            } else if (Util.randomInRange(0, 100) < pInvite) {
                g.requests.push(
                    new Request(-1, p.id, id, RequestStatus.AWAITING_USER));
            } else if (Util.randomInRange(0, 100) < pRequest) {
                g.requests.push(
                    new Request(-1, p.id, id, RequestStatus.AWAITING_GROUP));
            }
        }
        return g;
    }

    /**
     * Genera un "Rating" al azar
     */
    static randomRating(id, user, movie) {
        const labels = Util.fill(Util.randomInRange(1, 3),
            () => Util.randomChoice(Util.randomLabels)).join(",");
        return new Rating(id, user, movie,
            Math.random() > 0.5 ? Util.randomInRange(0, 5) : -1,
            Math.random() > 0.5 ? labels : "");
    }

    /**
     * Genera solicitudes al azar
     */
}

// funcion para generar datos de ejemplo
// se puede no-usar, o modificar libremente
async function populate(usersCount, groupsCount, moviesCount, ratingsCount) {
    const U = Util;

    // genera datos de ejemplo
    let lastId = 0;

    const users = U.fill(usersCount, () => U.randomUser(lastId++));
    const groups = U.fill(groupsCount, () => U.randomGroup(lastId++, users, 30, 20, 20));
    const movies = U.fill(moviesCount, () => U.randomMovie(lastId++));
    const ratings = U.randomPairs(ratingsCount, users.map(o => o.id), movies.map(o => o.id))
        .map(p => U.randomRating(lastId++, p[0], p[1]));

    if (serverToken != notConnectedToken) {
        console.log("Subiendo datos generados al servidor");
        const idMap = {}; // mapa de ids generadas a reales
        const filter = (forbidden, raw) => Object.keys(raw)
            .filter(key => !forbidden.includes(key))
            .reduce((obj, key) => {
                obj[key] = raw[key];
                return obj;
            }, {});

        for (let u of users) {
            await addUser(filter(["groups", "requests", "id"], u));
            idMap[u.id] = state.users.filter(x => x.username == u.username)[0].id;
        }
        for (let g of groups) {
            g.members = g.members.map(id => idMap[id]);
            g.owner = idMap[g.owner];
            let requests = g.requests;
            g.requests = [];
            await addGroup(g);
            g.id = state.groups.filter(x => x.name == g.name)[0].id;

            for (let r of requests) {
                r.user = idMap[r.user];
                r.group = g.id;
                await addRequest(r);
            }
        }
        for (let m of movies) {
            await addMovie(m);
            idMap[m.id] = state.movies.filter(x => x.imdb == m.imdb)[0].id;
        }

        for (let r of ratings) {
            r.user = idMap[r.user];
            r.movie = idMap[r.movie];
            await addRating(r);
        }
    } else {
        console.log("No conectado - usando datos generados localmente");
        console.log("FALTAN algunas referencias en users, groups, y movies");

        // arregla un poco requests
        const requests = [];
        groups.forEach(g => {
            const tmp = g.requests;
            g.requests = [];
            tmp.forEach(r => {
                r.id = lastId++;
                requests.push(r);
            });
        });

        // OJO: faltan algunas referencias
        updateState({
            name: "local",
            users, // sin grupos ni requests
            groups, // sin requests
            movies, // sin ratings
            ratings,
            requests
        });
    }
}

// el token antes de conectarte al servidor
const notConnectedToken = "no-has-hecho-login";

// el estado global
let state = new State();

// la direccion del servidor
let serverApiUrl = "//localhost:8080/api/";

// el token actual (procedente del ultimo login)
let serverToken = notConnectedToken;

// llama a esto con la URL de la api a la que te quieres conectar
function connect(apiUrl) {
    serverApiUrl = apiUrl;
    serverToken = notConnectedToken;
}

// acceso externo a la cache
function resolve(id) {
    return cache[id];
}

// cache de IDs; esto no se exporta
let cache = {};

// acceso y refresco de la cache de IDs; privado
function getId(id, object) {
    const found = cache[id] !== undefined;
    if (object) {
        if (found) throw Error("duplicate ID: " + id);
        cache[id] = object;
    } else {
        if (!found) throw Error("ID not found: " + id);
        return cache[id];
    }
}

// actualiza el estado de la aplicación con el resultado de una petición
function updateState(data) {
    cache = {};
    state = new State(data.name,
        data.users, data.groups, data.movies, data.ratings, data.requests);
    state.users.forEach(o => getId(o.id, o));
    state.movies.forEach(o => getId(o.id, o));
    state.groups.forEach(o => getId(o.id, o));
    state.requests.forEach(o => getId(o.id, o));
    state.ratings.forEach(o => getId(o.id, o));
    console.log("Updated state", state);
    return data;
}

// sube datos en json, espera json de vuelta; lanza error por fallos (status != 200)
// - encadena con un .then() para gestionar el JSON devuelto si todo va bien
// - y con un .catch() para gestionar un error. El catch recibe objetos con 
//   {
//      url: <direccion a la que estabas accediendo>, 
//      data: <datos que enviaste>,
//      status: <codigo de estado, por ejemplo 403>, 
//      text: <texto describiendo el error enviado por el servidor>
//   }
function go(url, method, data = {}) {
    let params = {
        method: method, // POST, GET, POST, PUT, DELETE, etc.
        headers: {
            "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(data)
    };
    if (method === "GET") {
        // GET requests cannot have body; I could URL-encode, but it would not be used here
        delete params.body;
    }
    console.log("sending", url, params)
    return fetch(url, params)
        .then(response => {
            const r = response;
            if (r.ok) {
                return r.json().then(json => Promise.resolve(json));
            } else {
                return r.text().then(text => Promise.reject({
                    url,
                    data: JSON.stringify(data),
                    status: r.status,
                    text
                }));
            }
        });
}

// hace login. Todas las futuras operaciones usan el token devuelto
function login(username, password) {
    return go(serverApiUrl + "login", 'POST', { username, password })
        .then(d => {
            serverToken = d.token;
            return list(); // actualiza todo
        });
}

// auxiliar para añadir
function addSomething(object, type) {
    if (object.id !== undefined) {
        console.log("OJO: cuando añades cosas, el ID se ignora");
    }
    return go(serverApiUrl + serverToken + "/add" + type, 'POST', object)
        .then(d => updateState(d));
}
// auxiliar para modificar
function setSomething(object, type) {
    if (object.id === undefined || resolve[id] === undefined) {
        error("para modificar cosas, debes de usar ID válido");
    }
    return go(serverApiUrl + serverToken + "/set" + type, 'POST', object)
        .then(d => updateState(d));
}
// auxiliar para eliminar
function rmSomething(id, type) {
    return go(serverApiUrl + serverToken + "/rm" + type, 'POST', { id })
        .then(d => updateState(d));
}

function addUser(o) { return addSomething(o, "user"); }

function addGroup(o) { return addSomething(o, "group"); }

function addMovie(o) { return addSomething(o, "movie"); }

function addRating(o) { return addSomething(o, "rating"); }

function addRequest(o) { return addSomething(o, "request"); }

function setUser(o) { return setSomething(o, "user"); }

function setGroup(o) { return setSomething(o, "group"); }

function setMovie(o) { return setSomething(o, "movie"); }

function setRating(o) { return setSomething(o, "rating"); }

function setRequest(o) { return setSomething(o, "request"); }

function rmUser(id) { return rmSomething(id, "user"); }

function rmGroup(id) { return rmSomething(id, "group"); }

function rmMovie(id) { return rmSomething(id, "movie"); }

function rmRating(id) { return rmSomething(id, "rating"); }

// actualiza el estado de la aplicación
function list() {
    return go(serverApiUrl + serverToken + "/list", 'POST')
        .then(d => updateState(d));
}

// cosas que estarán disponibles desde fuera de este módulo
export {

    // Clases
    State, // estado de la aplicación
    User, // usuario
    Group, // grupo
    Movie, // película
    Rating, // valoración y/o etiquetas (máx 1 por pareja persona+película)
    Request, // petición para entrar en grupo, o invitación del propietario
    RequestStatus, // posibles estados de una Request
    Util, // algunas utilidades; uso opcional

    // Estado local
    state, // el estado de la aplicación, según la última respuesta
    resolve, // devuelve objeto (User, Group, ...) para ese id, según "state"
    connect, // establece la URL del servidor. Debe llamarse antes de nada
    updateState, // llama a esto para actualizar state y hacer que resolve funcione

    // devuelve el token que necesitan el resto de las funciones
    login, // (username, password) --> devuelve un token válido

    // creación (objeto sin ID)
    addUser,
    addGroup,
    addMovie,
    addRating,
    addRequest,
    // modificación (objeto con ID)
    setUser,
    setGroup,
    setMovie,
    setRating,
    setRequest,
    // eliminación (sólo ID); para rmRequest, llama a setRequest indicando CANCEL
    rmUser,
    rmGroup,
    rmMovie,
    rmRating,

    // Refresca state, sin hacer cambios
    list,

    // Genera datos de partida
    populate,
};