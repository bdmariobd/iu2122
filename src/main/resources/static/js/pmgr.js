"use strict"

import * as Pmgr from './pmgrapi.js'

/**
 * Librería de cliente para interaccionar con el servidor de PeliManager (pmgr).
 * Prácticas de IU 2021-22
 *
 * Para las prácticas de IU, pon aquí (o en otros js externos incluidos desde tus .htmls) el código
 * necesario para añadir comportamientos a tus páginas.
 *
 * Recomiendo separar el fichero en 2 partes:
 * - parte "página-independiente": funciones que pueden generar cachos de
 *   contenido a partir del modelo, pero que no tienen referencias directas a la página
 * - parte pequeña, al final, de "pegamento": asocia comportamientos a
 *   elementos de la página.
 * Esto tiene la ventaja de que, si cambias tu página, sólo deberías tener
 * que cambiar el pegamento.
 *
 * Fuera de las prácticas, lee la licencia: dice lo que puedes hacer con él:
 * lo que quieras siempre y cuando
 * - no digas que eres el autor original.
 * - no me eches la culpa de haberlo escrito mal.
 *
 * @Author manuel.freire@fdi.ucm.es
 */

//
// PARTE 1:
// Código de comportamiento, que sólo se llama desde consola (para probarlo) o desde la parte 2,
// en respuesta a algún evento.
//

/**
 * 
 * @param {string} sel CSS usado para indicar qué fieldset quieres convertir
 * en estrellitas. Se espera que el fieldset tenga este aspecto:
 *      <label title="Atómico - 5 estrellas">
            <input type="radio" name="rating" value="5" />
        </label>

        <label title="Muy buena - 4 estrellas">
            <input type="radio" name="rating" value="4" />
        </label>

        <label title="Pasable - 3 estrellas">
            <input type="radio" name="rating" value="3" />
        </label>

        <label title="Más bien mala - 2 estrellas">
            <input type="radio" name="rating" value="2" />
        </label>

        <label title="Horrible - 1 estrella">
            <input type="radio" name="rating" value="1" />
        </label>
 */
function stars(sel) {
    const changeClassOnEvents = (ss, s) => {
        s.addEventListener("change", e => {
            // find current index
            const idx = e.target.value;
            // set selected for previous & self, remove for next
            ss.querySelectorAll("label").forEach(label => {
                if (label.children[0].value <= idx) {
                    label.classList.add("selected");
                } else {
                    label.classList.remove("selected");
                }
            });
        });
    };
    const activateStars = (ss) => {
        ss.classList.add("rating");
        ss.querySelectorAll("input").forEach(s =>
            changeClassOnEvents(ss, s));
        let parent = ss;
        while (!parent.matches("form")) {
            parent = parent.parentNode;
        }
        parent.addEventListener("reset", () => {
            ss.querySelectorAll("input").forEach(e => e.checked = false);
            ss.querySelectorAll("label").forEach(e => e.classList.remove("selected"));
        });
    }
    document.querySelectorAll(sel).forEach(activateStars);
}

function createMovieItem(movie) {
    const r2s = r => r > 0 ? Pmgr.Util.fill(r, () => "⭐").join("") : "";
    const ratings = movie.ratings.map(id => Pmgr.resolve(id)).map(r =>
        `<span class="badge bg-${r.user==userId?"primary":"secondary"}">
        ${Pmgr.resolve(r.user).username}: ${r.labels} ${r2s(r.rating)}
        </span>
        `
    ).join("");

    return `
    <div class="card" data-id="${movie.id}">
        <div class="card-header" data-id="${movie.id}">
            <h4 class="mb-0" title="${movie.id}">
                <a>${movie.name}</a> <small><i>(${movie.year})</i></small>
            </h4>
        </div>
        <div>
            <div class="card-body pcard">
                <div class="row">
                    <div class="col-auto">
                        <img class="iuthumb" src="${serverUrl}poster/${movie.imdb}"/>
                    </div>
                    <div class="col">
                        <div class="row-12">
                            ${movie.director} / ${movie.actors} (${movie.minutes} min.)
                        </div>        
                        <div class="row-12">
                            ${ratings}
                        </div>        
                        <div class="iucontrol movie">
                            <button class="rm" data-id="${movie.id}">🗑️</button>
                            <button class="edit" data-id="${movie.id}">✏️</button>
                            <button class="rate" data-id="${movie.id}">⭐</button>
                            <button class="details" data-id="${movie.id}" data-bs-toggle="modal" data-bs-target="#movieDetailsModal">🎃</button>
                        </div>  
                    </div>
                </div>
            </div>
        </div>
    </div>
 `;
}


function createGroupItem(group) {
    let allMembers = group.members.map((id) =>
        `<span class="badge bg-secondary">${Pmgr.resolve(id).username}</span>`
    ).join(" ");
    const waitingForGroup = r => r.status.toLowerCase() == Pmgr.RequestStatus.AWAITING_GROUP;
    let allPending = group.requests.map((id) => Pmgr.resolve(id)).map(r =>
        `<span class="badge bg-${waitingForGroup(r) ? "warning" : "info"}"
            title="Esperando aceptación de ${waitingForGroup(r) ? "grupo" : "usuario"}">
            ${Pmgr.resolve(r.user).username}</span>`

    ).join(" ");

    return `
    <div class="card">
    <div class="card-header">
        <h4 class="mb-0" title="${group.id}">
            <b class="pcard">${group.name}</b>
        </h4>
    </div>
    <div class="card-body pcard">
        <div class="row">
            <div class="col">
                <img src="/src/main/resources/static/img/icono_grupo.jpg" width="100" height="100"/>
            </div>
            <div class="col-md-6">
                <p>Fecha de creación: ${group.fecha}</p>
                <div class="row-sm-11">
                    <p>Participantes:
                        <span class="badge bg-primary">${Pmgr.resolve(group.owner).username}</span>
                        ${allMembers}
                        ${allPending}
                    </p>        
                </div>
                <p>Género favorito: ${group.favorito}</p>
            </div>
            <div class="col">
                <div class="dropdown">
                    <button class="btn btn-default btn-circle btn-l offset-md-4" type="button" data-bs-toggle="dropdown" aria-expanded="false" id="dropdownGroupsButton">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                            <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                        </svg>
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="dropdownGroupsButton">
                        <li><a class="dropdown-item" data-id="${group.id}">🗑️</a></li>
                        <li><a class="dropdown-item" data-id="${group.id}">✏️</a></li>
                        <li><a class="dropdown-item" href="#">🕵🏻‍♀️ (Ver detalles)</a></li>
                    </ul>
                </div>
            </div>

        </div>
    </div>              
    </div>
    </div>
`;
}


function createUserItem(user) {
    let allGroups = user.groups.map((id) =>
        `<span class="badge bg-secondary">${Pmgr.resolve(id).name}</span>`
    ).join(" ");
    const waitingForGroup = r => r.status.toLowerCase() == Pmgr.RequestStatus.AWAITING_GROUP;
    let allPending = user.requests.map((id) => Pmgr.resolve(id)).map(r =>
        `<span class="badge bg-${waitingForGroup(r) ? "warning" : "info"}"
            title="Esperando aceptación de ${waitingForGroup(r) ? "grupo" : "usuario"}">
            ${Pmgr.resolve(r.group).name}</span>`
    ).join(" ");

    return `
    <div class="card">
        <div class="card-header">
            <h4 class="mb-0" title="${user.id}">
                <b class="pcard">${user.username}</b>
            </h4>
        </div>
        <div class="card-body pcard">
            <div class="row-sm-11">
                ${allGroups}
                ${allPending}
            </div>
            <div class="row-sm-1 iucontrol user">
                <button class="rm" data-id="${user.id}">🗑️</button>
                <button class="edit" data-id="${user.id}">✏️</button>
            </div>        
        </div>
    </div>
`;
}

/**
 * 
 * @param {*} idUser 
 * @returns usuario con idUser es admin o no
 */
function isAdmin(idUser) {
    return Pmgr.resolve(idUser).role === 'ADMIN,USER';
}

/**
 * Usa valores de un formulario para añadir una película
 * @param {Element} formulario para con los valores a subir
 */
function nuevaPelicula(formulario) {
    const movie = new Pmgr.Movie(-1,
        formulario.querySelector('input[name="imdb"]').value,
        formulario.querySelector('input[name="name"]').value,
        formulario.querySelector('input[name="director"]').value,
        formulario.querySelector('input[name="actors"]').value,
        formulario.querySelector('input[name="year"]').value,
        formulario.querySelector('input[name="minutes"]').value);
    Pmgr.addMovie(movie).then(() => {
        formulario.reset() // limpia el formulario si todo OK
        update();
    });
}

/**
 * Usa valores de un formulario para modificar una película
 * @param {Element} formulario para con los valores a subir
 */
function modificaPelicula(formulario) {
    const movie = new Pmgr.Movie(
        formulario.querySelector('input[name="id"]').value,
        formulario.querySelector('input[name="imdb"]').value,
        formulario.querySelector('input[name="name"]').value,
        formulario.querySelector('input[name="director"]').value,
        formulario.querySelector('input[name="actors"]').value,
        formulario.querySelector('input[name="year"]').value,
        formulario.querySelector('input[name="minutes"]').value)
    Pmgr.setMovie(movie).then(() => {
        formulario.reset() // limpia el formulario si todo OK
        modalEditMovie.hide(); // oculta el formulario
        update();
    }).catch(e => console.log(e));
}

/**
 * Usa valores de un formulario para añadir un rating
 * @param {Element} formulario para con los valores a subir
 */
function nuevoRating(formulario) {
    const rating = new Pmgr.Rating(-1,
        formulario.querySelector('input[name="user"]').value,
        formulario.querySelector('input[name="movie"]').value,
        formulario.querySelector('input[name="rating"]:checked').value,
        formulario.querySelector('input[name="labels"]').value);
    Pmgr.addRating(rating).then(() => {
        formulario.reset() // limpia el formulario si todo OK
        modalRateMovie.hide(); // oculta el formulario
        update();
    }).catch(e => console.log(e));
}

/**
 * Usa valores de un formulario para modificar un rating
 * @param {Element} formulario para con los valores a subir
 */
function modificaRating(formulario) {
    const rating = new Pmgr.Rating(
        formulario.querySelector('input[name="id"]').value,
        formulario.querySelector('input[name="user"]').value,
        formulario.querySelector('input[name="movie"]').value,
        formulario.querySelector('input[name="rating"]:checked').value,
        formulario.querySelector('input[name="labels"]').value);
    Pmgr.setRating(rating).then(() => {
        formulario.reset() // limpia el formulario si todo OK
        modalRateMovie.hide(); // oculta el formulario
        update();
    }).catch(e => console.log(e));
}

/**
 * Usa valores de un formulario para añadir una película
 * @param {Element} formulario para con los valores a subir
 */
function generaPelicula(formulario) {
    const movie = Pmgr.Util.randomMovie();
    for (let [k, v] of Object.entries(movie)) {
        const input = formulario.querySelector(`input[name="${k}"]`);
        if (input) input.value = v;
    }
}

/**
 * En un div que contenga un campo de texto de búsqueda
 * y un select, rellena el select con el resultado de la
 * funcion actualizaElementos (que debe generar options), y hace que
 * cualquier búsqueda filtre los options visibles.
 */
let oldHandler = false;
/**
 * Comportamiento de filtrado dinámico para un select-con-busqueda.
 * 
 * Cada vez que se modifica la búsqueda, se refresca el select para mostrar sólo 
 * aquellos elementos que contienen lo que está escrito en la búsqueda
 * 
 * @param {string} div selector que devuelve el div sobre el que operar
 * @param {Function} actualiza el contenido del select correspondiente
 */
function activaBusquedaDropdown(div, actualiza) {
    let search = document.querySelector(`${div} input[type=search]`);
    let select = document.querySelector(`${div} select`);

    // vacia el select, lo llena con elementos validos
    actualiza(`${div} select`);

    // manejador
    const handler = () => {
        let w = search.value.trim().toLowerCase();
        let items = document.querySelectorAll(`${div} select>option`);

        // filtrado; poner o.style.display = '' muestra, = 'none' oculta
        items.forEach(o =>
            o.style.display = (o.innerText.toLowerCase().indexOf(w) > -1) ? '' : 'none');

        // muestra un array JS con los seleccionados
        console.log("Seleccionados:", select.value);
    };

    // filtrado dinámico
    if (oldHandler) {
        search.removeEventListener('input', handler);
    }
    oldHandler = search.addEventListener('input', handler);
}

//
// Función que refresca toda la interfaz. Debería llamarse tras cada operación
// por ejemplo, Pmgr.addGroup({"name": "nuevoGrupo"}).then(update); // <--
//
function update() {
    const appendTo = (sel, html) =>
        document.querySelector(sel).insertAdjacentHTML("beforeend", html);
    const empty = (sel) => {
        const destino = document.querySelector(sel);
        while (destino.firstChild) {
            destino.removeChild(destino.firstChild);
        }
    }
    try {
        // vaciamos los contenedores
        empty("#movies");
        empty("#groups");
        empty("#users");

        // y los volvemos a rellenar con su nuevo contenido
        Pmgr.state.movies.forEach(o => appendTo("#movies", createMovieItem(o)));
        Pmgr.state.groups.forEach(o => appendTo("#groups", createGroupItem(o)));
        Pmgr.state.users.forEach(o => appendTo("#users", createUserItem(o)));

        // y añadimos manejadores para los eventos de los elementos recién creados
        // botones de borrar películas
        document.querySelectorAll(".iucontrol.movie button.rm").forEach(b =>
            b.addEventListener('click', e => {
                const id = e.target.dataset.id; // lee el valor del atributo data-id del boton
                Pmgr.rmMovie(id).then(update);
            }));
        // botones de editar películas
        document.querySelectorAll(".iucontrol.movie button.edit").forEach(b =>
            b.addEventListener('click', e => {
                const id = e.target.dataset.id; // lee el valor del atributo data-id del boton
                const movie = Pmgr.resolve(id);
                const formulario = document.querySelector("#movieEditForm");
                for (let [k, v] of Object.entries(movie)) {
                    // rellenamos el formulario con los valores actuales
                    const input = formulario.querySelector(`input[name="${k}"]`);
                    if (input) input.value = v;
                }

                modalEditMovie.show(); // ya podemos mostrar el formulario
            }));
        // botones de evaluar películas
        document.querySelectorAll(".iucontrol.movie button.rate").forEach(b =>
            b.addEventListener('click', e => {
                const id = e.target.dataset.id; // lee el valor del atributo data-id del boton
                const formulario = document.querySelector("#movieRateForm");
                const prev = Pmgr.state.ratings.find(r => r.movie == id && r.user == userId);
                if (prev) {
                    // viejo: copia valores
                    formulario.querySelector("input[name=id]").value = prev.id;
                    const input = formulario.querySelector(`input[value="${prev.rating}"]`);
                    if (input) {
                        input.checked;
                    }
                    // lanza un envento para que se pinten las estrellitas correctas
                    // see https://stackoverflow.com/a/2856602/15472
                    if ("createEvent" in document) {
                        const evt = document.createEvent("HTMLEvents");
                        evt.initEvent("change", false, true);
                        input.dispatchEvent(evt);
                    } else {
                        input.fireEvent("onchange");
                    }
                    formulario.querySelector("input[name=labels]").value = prev.labels;
                } else {
                    // nuevo
                    formulario.reset();
                    formulario.querySelector("input[name=id]").value = -1;
                }
                formulario.querySelector("input[name=movie]").value = id;
                formulario.querySelector("input[name=user]").value = userId;
                modalRateMovie.show(); // ya podemos mostrar el formulario
            }));
        // botones de borrar grupos
        document.querySelectorAll(".iucontrol.group button.rm").forEach(b =>
            b.addEventListener('click', e => Pmgr.rmGroup(e.target.dataset.id).then(update)));
        // botones de borrar usuarios
        document.querySelectorAll(".iucontrol.user button.rm").forEach(b =>
            b.addEventListener('click', e => Pmgr.rmUser(e.target.dataset.id).then(update)));

        //modal detalles de cada película
        document.querySelectorAll(".iucontrol.movie button.details, #movies .card .card-header").forEach(b =>
            b.addEventListener('click', e => {
                const id = e.currentTarget.dataset.id; // lee el valor del atributo data-id del boton
                const movie = Pmgr.resolve(id);
                const movieData = document.querySelector("#movieDetails");
                movieData.querySelector(`img`).src = `${serverUrl}poster/${movie.imdb}`;
                movieData.querySelector(`h2`).innerHTML = movie.name;
                movieData.querySelector(`label1`).innerHTML = movie.director;
                movieData.querySelector(`label2`).innerHTML = movie.labels;
                movieData.querySelector(`label3`).innerHTML = movie.year;
                movieData.querySelector(`label4`).innerHTML = movie.minutes;

                modalDetailsMovie.show(); // ya podemos mostrar el formulario
            }));

    } catch (e) {
        console.log('Error actualizando', e);
    }

    /* para que siempre muestre los últimos elementos disponibles */
    activaBusquedaDropdown('#dropdownBuscablePelis',
        (select) => {
            empty(select);
            Pmgr.state.movies.forEach(m =>
                appendTo(select, `<option value="${m.id}">${m.name}</option>`));
        }
    );
}

//
// PARTE 2:
// Código de pegamento, ejecutado sólo una vez que la interfaz esté cargada.
//

// modales, para poder abrirlos y cerrarlos desde código JS
const modalEditMovie = new bootstrap.Modal(document.querySelector('#movieEdit'));
const modalRateMovie = new bootstrap.Modal(document.querySelector('#movieRate'));
const modalDetailsMovie = new bootstrap.Modal(document.querySelector('#movieDetailsModal'));
/* const modalAddMovie = new bootstrap.Modal(document.querySelector('#movieAddModal'));
 */

// si lanzas un servidor en local, usa http://localhost:8080/
const serverUrl = "http://gin.fdi.ucm.es/iu/";

Pmgr.connect(serverUrl + "api/");

// guarda el ID que usaste para hacer login en userId
let userId = -1;
const login = (username, password) => {
    Pmgr.login(username, password)
        .then(d => {
            console.log("login ok!", d);
            update(d);
            userId = Pmgr.state.users.find(u =>
                u.username == username).id;
        })
        .catch(e => {
            console.log(e, `error ${e.status} en login (revisa la URL: ${e.url}, y verifica que está vivo)`);
            console.log(`el servidor dice: "${e.text}"`);
        });
}

// -- IMPORTANTE --
login("g7", "8RKrb"); // <-- tu nombre de usuario y password aquí
//   y puedes re-logearte como alguien distinto desde  la consola
//   llamando a login() con otro usuario y contraseña
{
    /** 
     * Asocia comportamientos al formulario de añadir películas 
     * en un bloque separado para que las constantes y variables no salgan de aquí, 
     * manteniendo limpio el espacio de nombres del fichero
     */
    const f = document.querySelector("#addMovie form");
    // botón de enviar
    f.querySelector("button[type='submit']").addEventListener('click', (e) => {
        if (f.checkValidity()) {
            e.preventDefault(); // evita que se haga lo normal cuando no hay errores
            nuevaPelicula(f); // añade la pelicula según los campos previamente validados
        }
    });
    // botón de generar datos (sólo para pruebas)
    f.querySelector("button.generar").addEventListener('click',
        (e) => generaPelicula(f)); // aquí no hace falta hacer nada raro con el evento
} {
    /**
     * formulario para modificar películas
     */
    const f = document.querySelector("#movieEditForm");
    // botón de enviar
    document.querySelector("#movieEdit button.edit").addEventListener('click', e => {
        console.log("enviando formulario!");
        if (f.checkValidity()) {
            modificaPelicula(f); // modifica la pelicula según los campos previamente validados
        } else {
            e.preventDefault();
            f.querySelector("button[type=submit]").click(); // fuerza validacion local
        }
    });
} {
    /**
     * formulario para evaluar películas; usa el mismo modal para añadir y para editar
     */
    const f = document.querySelector("#movieRateForm");
    // botón de enviar
    document.querySelector("#movieRate button.edit").addEventListener('click', e => {
        console.log("enviando formulario!");
        if (f.checkValidity()) {
            if (f.querySelector("input[name=id]").value == -1) {
                nuevoRating(f);
            } else {
                modificaRating(f); // modifica la evaluación según los campos previamente validados
            }
        } else {
            e.preventDefault();
            f.querySelector("button[type=submit]").click(); // fuerza validacion local
        }
    });
    // activa rating con estrellitas
    stars("#movieRateForm .estrellitas");
}

/**
 * búsqueda básica de películas, por título
 */
{
    document.querySelector("#movieSearch").addEventListener("input", e => {
        const v = e.target.value.toLowerCase();
        document.querySelectorAll("#movies div.card").forEach(c => {
            const m = Pmgr.resolve(c.dataset.id);
            // aquí podrías aplicar muchos más criterios
            const ok = m.name.toLowerCase().indexOf(v) >= 0;
            c.style.display = ok ? '' : 'none';
        });
    })
}

{
    document.querySelector("#movieSearch").addEventListener("input", e => {
        const v = e.target.value.toLowerCase();
        document.querySelectorAll("#movies div.card").forEach(c => {
            const m = Pmgr.resolve(c.dataset.id);
            // aquí podrías aplicar muchos más criterios
            const ok = m.name.toLowerCase().indexOf(v) >= 0;
            c.style.display = ok ? '' : 'none';
        });
    })

    document.querySelector("#movieSearchByDirector").addEventListener("input", e => {
        const v = e.target.value.toLowerCase();
        document.querySelectorAll("#movies div.card").forEach(c => {
            const m = Pmgr.resolve(c.dataset.id);
            // aquí podrías aplicar muchos más criterios
            const ok = m.director.toLowerCase().indexOf(v) >= 0;
            c.style.display = ok ? '' : 'none';
        });
    })

    document.querySelector("#movieSearchByYear").addEventListener("input", e => {
        const v = e.target.value.toLowerCase();
        document.querySelectorAll("#movies div.card").forEach(c => {
            const m = Pmgr.resolve(c.dataset.id);
            // aquí podrías aplicar muchos más criterios
            const ok = m.year == v;
            c.style.display = ok ? '' : 'none';
        });
    })

    document.querySelector("#movieSearchByMinutesMin").addEventListener("input", e => {
        const v = e.target.value.toLowerCase();
        document.querySelectorAll("#movies div.card").forEach(c => {
            const m = Pmgr.resolve(c.dataset.id);
            // aquí podrías aplicar muchos más criterios
            const ok = m.minutes >= v;
            c.style.display = ok ? '' : 'none';
        });
    })

    document.querySelector("#movieSearchByMinutesMax").addEventListener("input", e => {
        const v = e.target.value.toLowerCase();
        document.querySelectorAll("#movies div.card").forEach(c => {
            const m = Pmgr.resolve(c.dataset.id);
            // aquí podrías aplicar muchos más criterios
            const ok = m.minutes <= v;
            c.style.display = ok ? '' : 'none';
        });
    })



}



// cosas que exponemos para poder usarlas desde la consola
window.modalEditMovie = modalEditMovie;
window.modalRateMovie = modalRateMovie;
window.modalDetailsMovie = modalDetailsMovie;

window.update = update;
window.login = login;
window.userId = userId;
window.Pmgr = Pmgr;
window.isAdmin = isAdmin;

// ejecuta Pmgr.populate() en una consola para generar datos de prueba en servidor
// ojo - hace *muchas* llamadas a la API (mira su cabecera para más detalles)
// Pmgr.populate();