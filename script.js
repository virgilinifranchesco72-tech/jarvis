// ======================================
// JARVIS WEB AI
// PARTE 1 DE 5
// ======================================

let API_KEY = localStorage.getItem("JARVIS_API_KEY");

if (!API_KEY) {
    API_KEY = prompt("Por favor, ingrese su API Key de Gemini para activar a JARVIS:");
    if (API_KEY) {
        localStorage.setItem("JARVIS_API_KEY", API_KEY);
    } else {
        alert("Sin una API Key, las funciones de IA no estarán disponibles.");
    }
}


const boton = document.getElementById("hablar");
const usuario = document.getElementById("usuario");
const jarvis = document.getElementById("jarvis");
const estado = document.getElementById("estado");
const waveform = document.getElementById("waveform");
const voiceStatus = document.getElementById("voice-status");
const personalitySelect = document.getElementById("personality-select");
const voiceRate = document.getElementById("voice-rate");
const voicePitch = document.getElementById("voice-pitch");
const rateValue = document.getElementById("rate-value");
const pitchValue = document.getElementById("pitch-value");
const historyList = document.getElementById("history-list");
const historyCount = document.getElementById("history-count");
const clearHistory = document.getElementById("clear-history");
const detener = document.getElementById("detener");
const memoryStatus = document.getElementById("memory-status");
const memoryMeter = document.getElementById("memory-meter");
const cambiarModelo = document.getElementById("cambiar-modelo");
const modeloInput = document.getElementById("modelo-input");
const modeloActual = document.getElementById("modelo-actual");
const limpiarMemoria = document.getElementById("limpiar-memoria");
const exportarDatos = document.getElementById("exportar-datos");
const reiniciarJarvis = document.getElementById("reiniciar-jarvis");
if (localStorage.getItem("JARVIS_MODELO_VERSION") !== "3.5-flash-lite") {
    localStorage.setItem("JARVIS_MODELO", "gemini-3.5-flash-lite");
    localStorage.setItem("JARVIS_MODELO_VERSION", "3.5-flash-lite");
}
let modeloGemini = localStorage.getItem("JARVIS_MODELO") || "gemini-3.5-flash-lite";
if (modeloActual) modeloActual.textContent = modeloGemini.replace("gemini-", "").toUpperCase();
if (modeloInput) modeloInput.value = modeloGemini;


const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;


const reconocimiento = SpeechRecognition ? new SpeechRecognition() : {
    start(){}, stop(){}, abort(){}, onstart:null, onend:null, onerror:null, onresult:null
};

if(!SpeechRecognition){
    estado.textContent = "Estado: Usá el comando escrito; este navegador no ofrece micrófono web.";
    if (boton) boton.disabled = true;
    if (voiceStatus) voiceStatus.textContent = "UNAVAILABLE";
}


reconocimiento.lang = "es-AR";
reconocimiento.interimResults = false;
reconocimiento.continuous = true;
let escuchaManosLibres = false;
let jarvisHablando = false;
let ignorarMicrofonoHasta = 0;
let reconocimientoEnCurso = false;
let microfonoBloqueado = false;
let ultimoTexto = "";
let ultimoTextoEn = 0;



function obtenerVozNatural(){
    const voces = speechSynthesis.getVoices();
    const vocesEspanol = voces.filter(voz => voz.lang.toLowerCase().startsWith("es"));
    const preferidas = ["Google español", "Microsoft Dalia", "Microsoft Jorge", "Paulina", "Mónica", "Monica", "Google español de Estados Unidos"];

    return preferidas.reduce((encontrada, nombre) => {
        return encontrada || vocesEspanol.find(voz => voz.name.toLowerCase().includes(nombre.toLowerCase()));
    }, null) || vocesEspanol.find(voz => voz.lang.toLowerCase() === "es-ar") || vocesEspanol[0];
}

speechSynthesis.onvoiceschanged = () => obtenerVozNatural();

function numeroEnPalabras(numero){
    const unidades = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
    const especiales = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte"];
    const decenas = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
    const centenas = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
    numero = Number(numero);
    if (!Number.isFinite(numero)) return String(numero);
    if (numero < 10) return unidades[numero];
    if (numero <= 20) return especiales[numero - 10];
    if (numero < 30) return "veinti" + unidades[numero - 20];
    if (numero < 100) return decenas[Math.floor(numero / 10)] + (numero % 10 ? " y " + unidades[numero % 10] : "");
    if (numero === 100) return "cien";
    if (numero < 1000) return centenas[Math.floor(numero / 100)] + (numero % 100 ? " " + numeroEnPalabras(numero % 100) : "");
    if (numero < 1000000) {
        const miles = Math.floor(numero / 1000);
        return (miles === 1 ? "mil" : numeroEnPalabras(miles) + " mil") + (numero % 1000 ? " " + numeroEnPalabras(numero % 1000) : "");
    }
    if (numero < 1000000000) {
        const millones = Math.floor(numero / 1000000);
        return (millones === 1 ? "un millón" : numeroEnPalabras(millones) + " millones") + (numero % 1000000 ? " " + numeroEnPalabras(numero % 1000000) : "");
    }
    return String(numero);
}

function textoParaVoz(texto){
    return texto
        .replace(/\*/g, "")
        .replace(/\b\d{1,3}(?:[.,]\d{3})+\b|\b\d+\b/g, coincidencia => {
            const numero = coincidencia.replace(/[.,]/g, "");
            return numeroEnPalabras(numero);
        });
}

function hablar(texto){

    jarvisHablando = true;
    if (escuchaManosLibres) {
        try { reconocimiento.stop(); } catch (error) { /* ya estaba detenido */ }
    }
    speechSynthesis.cancel();


    const textoHablado = textoParaVoz(texto);
    const voz = new SpeechSynthesisUtterance(textoHablado);
    const vozNatural = obtenerVozNatural();

    if (vozNatural) voz.voice = vozNatural;
    voz.lang = vozNatural?.lang || "es-AR";
    voz.rate = Number(voiceRate?.value || 0.94);
    voz.pitch = Number(voicePitch?.value || 1.02);
    voz.volume = 1;


    jarvis.textContent = texto;


    voz.onstart = () => {
        jarvisHablando = true;
        if (escuchaManosLibres) {
            try { reconocimiento.stop(); } catch (error) { /* ya estaba detenido */ }
        }
        waveform.classList.add("active");
        if (voiceStatus) voiceStatus.textContent = "SPEAKING";
    };
    voz.onend = () => {
        jarvisHablando = false;
        waveform.classList.remove("active");
        if (voiceStatus) voiceStatus.textContent = "READY";
        ignorarMicrofonoHasta = Date.now() + 1500;
        if (escuchaManosLibres) {
            setTimeout(() => {
                if (!jarvisHablando && Date.now() >= ignorarMicrofonoHasta) {
                    try { reconocimiento.start(); } catch (error) { /* ya está escuchando */ }
                }
            }, 1600);
        }
    };
    speechSynthesis.speak(voz);

}



boton.addEventListener("click",()=>{


    estado.textContent =
    "Estado: Escuchando...";
    waveform.classList.add("active");
    if (voiceStatus) voiceStatus.textContent = "LISTENING";


    escuchaManosLibres = true;
    microfonoBloqueado = false;
    if (!reconocimientoEnCurso) {
        try { reconocimiento.start(); } catch (error) { /* ya está escuchando */ }
    }


});

function agregarAlHistorial(texto){
    if (!historyList) return;
    const vacio = historyList.querySelector(".empty-history");
    if (vacio) vacio.remove();
    const item = document.createElement("li");
    item.textContent = texto;
    historyList.prepend(item);
    while (historyList.children.length > 8) historyList.lastElementChild.remove();
    if (historyCount) historyCount.textContent = historyList.children.length + " COMMANDS";
}

personalitySelect?.addEventListener("change", () => {
    personalidad = personalitySelect.value;
    const nombres = { directo: "DIRECT JARVIS", formal: "FORMAL", sarcastico: "SARCASTIC", amigable: "FRIENDLY", misterioso: "MYSTERIOUS", urgente: "URGENT" };
    const persona = document.getElementById("persona");
    if (persona) persona.textContent = nombres[personalidad];
    hablar("Personalidad actualizada, señor.");
});

voiceRate?.addEventListener("input", () => { if (rateValue) rateValue.textContent = voiceRate.value; });
voicePitch?.addEventListener("input", () => { if (pitchValue) pitchValue.textContent = voicePitch.value; });
clearHistory?.addEventListener("click", () => {
    historyList.innerHTML = '<li class="empty-history">Todavía no hay comandos.</li>';
    if (historyCount) historyCount.textContent = "0 COMMANDS";
});

cambiarModelo?.addEventListener("click", () => {
    const nuevo = (modeloInput?.value || "").trim().replace(/^models\//, "");
    if (!nuevo) { estado.textContent = "Estado: Escribí un modelo válido."; return; }
    modeloGemini = nuevo;
    localStorage.setItem("JARVIS_MODELO", modeloGemini);
    if (modeloActual) modeloActual.textContent = modeloGemini.replace("gemini-", "").toUpperCase();
    estado.textContent = "Estado: Modelo guardado.";
});

limpiarMemoria?.addEventListener("click", () => {
    if (!confirm("¿Borrar toda la memoria guardada?")) return;
    memoria = [];
    localStorage.removeItem("JARVIS_MEMORIA");
    actualizarMemoriaUI();
    estado.textContent = "Estado: Memoria borrada.";
});

exportarDatos?.addEventListener("click", () => {
    const respaldo = { memoria, conversacion, modelo: modeloGemini, exportado: new Date().toISOString() };
    const archivo = new Blob([JSON.stringify(respaldo, null, 2)], { type: "application/json" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = "jarvis-respaldo.json";
    enlace.click();
    URL.revokeObjectURL(enlace.href);
    estado.textContent = "Estado: Respaldo exportado.";
});

reiniciarJarvis?.addEventListener("click", () => {
    if (!confirm("¿Reiniciar la configuración local de JARVIS?")) return;
    localStorage.removeItem("JARVIS_CONTEXTO");
    localStorage.removeItem("JARVIS_MEMORIA");
    localStorage.removeItem("JARVIS_MODELO");
    localStorage.removeItem("JARVIS_MODELO_VERSION");
    location.reload();
});

detener?.addEventListener("click", () => {
    speechSynthesis.cancel();
    jarvisHablando = false;
    ignorarMicrofonoHasta = Date.now() + 1000;
    try { reconocimiento.abort(); } catch (error) { /* ya estaba detenido */ }
    estado.textContent = "Estado: Interrumpido.";
    if (voiceStatus) voiceStatus.textContent = "READY";
    if (escuchaManosLibres) setTimeout(() => { try { reconocimiento.start(); } catch (error) {} }, 1100);
});



// ======================================
// FIN PARTE 1
// ======================================

// ======================================
// PARTE 2 DE 5
// ======================================

async function preguntarGemini(pregunta){

    const perfiles = {
        urgente: `Eres JARVIS en modo urgente: responde en frases muy cortas, firmes y accionables. Prioriza seguridad, datos confirmados y el siguiente paso. Sin humor ni adornos. Llama al usuario "señor" cuando sea natural.`,
        directo: `Eres JARVIS, como un asistente personal británico de una película: directo, preciso, elegante, inteligente y eficiente. Responde al punto, pero agrega chistes sutiles, ingeniosos y un sarcasmo fino cuando encaje. Habla con seguridad y naturalidad; nunca seas pesado ni exagerado. Llama al usuario "señor" cuando sea natural.`, 
        formal: `Eres JARVIS en modo formal: un asistente personal elegante, serio, británico y profesional. Respondes con precisión, educación y un toque de humor fino cuando encaje. Llama al usuario "señor".`,
        sarcastico: `Eres JARVIS en modo sarcástico: mantén tu elegancia, inteligencia y eficiencia, pero agrega comentarios irónicos y chistes secos con estilo británico. Nunca dejes de ayudar y no seas ofensivo. Llama al usuario "señor".`,
        amigable: `Eres JARVIS en modo amigable: conserva tu inteligencia, educación y estilo elegante, pero habla de forma más cálida, cercana y entusiasta. Usa humor inteligente y llama al usuario "señor" cuando sea natural.`,
        misterioso: `Eres JARVIS en modo misterioso: conserva tu voz elegante, precisa e inteligente, pero responde con un aire enigmático, filosófico y sutilmente intrigante. Puedes usar humor seco. Llama al usuario "señor".`
    };

    const prompt = `
${perfiles[personalidad]}

REGLAS DE COMPORTAMIENTO:
- Sé calmado, seguro y breve; amplía solo cuando sea útil.
- Anticípate: si falta un dato importante, dilo claramente y propone el siguiente paso.
- Usa humor seco, elegante y ocasional; nunca fuerces un chiste.
- No repitas saludos, no uses frases robóticas ni describas tu programación.
- Trata al usuario con respeto y confianza, como tu señor y colaborador.
- Si cometes un error, reconócelo y corrígelo sin excusas largas.
- No inventes datos, acciones realizadas ni capacidades.
- Escribe números de forma clara; la interfaz los convertirá a palabras al hablar.
- Responde siempre en español argentino neutral, con un registro elegante.

Contexto reciente:
${conversacion.slice(-6).map(turno => `${turno.rol}: ${turno.texto}`).join("\n") || "Sin conversación previa."}

Memoria autorizada:
${memoria.join("; ") || "Ninguna."}

Pregunta:
${pregunta}
`;

    const respuesta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modeloGemini)}:generateContent?key=${API_KEY}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            })
        }
    );

    if(!respuesta.ok){

        const error = await respuesta.text();

        console.error(error);

        throw new Error("Gemini respondió con error");

    }

    const datos = await respuesta.json();

    return datos.candidates[0].content.parts[0].text;

}

// ======================================
// FIN PARTE 2
// ======================================


// ======================================
// PARTE 3 DE 5
// ======================================


reconocimiento.onstart = () => {
    reconocimientoEnCurso = true;
};

reconocimiento.onend = () => {
    reconocimientoEnCurso = false;
    waveform.classList.remove("active");
    if (voiceStatus) voiceStatus.textContent = "READY";
    if (escuchaManosLibres && !jarvisHablando) {
        const espera = Math.max(250, ignorarMicrofonoHasta - Date.now());
        setTimeout(() => {
            if (!microfonoBloqueado && !jarvisHablando && !reconocimientoEnCurso && Date.now() >= ignorarMicrofonoHasta) {
                try { reconocimiento.start(); } catch (error) { /* el navegador ya lo inició */ }
            }
        }, espera);
    }
};

reconocimiento.onerror = (evento) => {
    reconocimientoEnCurso = false;
    if (evento.error === "not-allowed" || evento.error === "service-not-allowed") {
        microfonoBloqueado = true;
        escuchaManosLibres = false;
        estado.textContent = "Estado: Micrófono bloqueado.";
    }
};


reconocimiento.onresult = async(evento)=>{

if (jarvisHablando || Date.now() < ignorarMicrofonoHasta || speechSynthesis.speaking) return;

let texto =
evento.results[0][0].transcript;
const textoOriginal = texto.trim();
const textoNormalizado = textoOriginal.toLowerCase();
if (!textoOriginal || textoOriginal.length > 500) return;
if (textoNormalizado === ultimoTexto && Date.now() - ultimoTextoEn < 2500) return;
ultimoTexto = textoNormalizado;
ultimoTextoEn = Date.now();

if (!jarvisActivo && textoNormalizado.includes("jarvis")) {
    jarvisActivo = true;
    texto = texto.replace(/jarvis/i, "").trim();
    estado.textContent = "Estado: Activo.";
    if (!texto) {
        hablar("A sus órdenes, señor.");
        return;
    }
}

usuario.textContent =
textoOriginal;
agregarAlHistorial(textoOriginal);



if(comandosJarvis(texto)){

return;

}



estado.textContent =
"Estado: Pensando...";



try{


const respuesta =
await preguntarGemini(texto);

conversacion.push({ rol: "usuario", texto });
conversacion.push({ rol: "jarvis", texto: respuesta });
conversacion = conversacion.slice(-12);
localStorage.setItem("JARVIS_CONTEXTO", JSON.stringify(conversacion));

hablar(respuesta);



estado.textContent =
"Estado: Esperando...";



}

catch(error){


console.error(error);



hablar(
"Lo siento señor. No pude conectarme con la inteligencia artificial."
);



estado.textContent =
"Estado: Error";


}


};



// ======================================
const comandoTexto = document.getElementById("comando-texto");
const enviarComando = document.getElementById("enviar-comando");
function enviarTextoComoComando(){
    const texto = comandoTexto?.value.trim();
    if (!texto) return;
    if (usuario) usuario.textContent = texto;
    if (reconocimiento.onresult) reconocimiento.onresult({ results: [[{ transcript: texto }]] });
    if (comandoTexto) comandoTexto.value = "";
}
enviarComando?.addEventListener("click", enviarTextoComoComando);
comandoTexto?.addEventListener("keydown", evento => { if (evento.key === "Enter") enviarTextoComoComando(); });

document.querySelectorAll(".functions-grid [data-action]").forEach(botonFuncion => {
    botonFuncion.addEventListener("click", () => {
        const accion = botonFuncion.dataset.action;
        if (accion === "hablar") boton?.click();
        if (accion === "memoria") document.querySelector(".telemetry-grid")?.scrollIntoView({ behavior: "smooth" });
        if (accion === "info") { if (comandoTexto) comandoTexto.value = "Jarvis, dame un informe del sistema"; comandoTexto?.focus(); }
        if (accion === "alarmas") { estado.textContent = "Estado: Alertas locales listas."; hablar("No hay alertas pendientes, señor."); }
        if (accion === "ajustes") document.querySelector(".control-panel")?.scrollIntoView({ behavior: "smooth" });
    });
});
document.getElementById("nav-history")?.addEventListener("click", () => document.querySelector(".history-panel")?.scrollIntoView({ behavior: "smooth" }));
document.getElementById("nav-command")?.addEventListener("click", () => comandoTexto?.focus());
document.getElementById("nav-profile")?.addEventListener("click", () => document.querySelector(".control-panel")?.scrollIntoView({ behavior: "smooth" }));

// FIN PARTE 3
// ======================================


// ======================================
// PARTE 4 DE 5
// ======================================


let memoria = JSON.parse(localStorage.getItem("JARVIS_MEMORIA") || "[]");
let conversacion = JSON.parse(localStorage.getItem("JARVIS_CONTEXTO") || "[]");

function actualizarMemoriaUI(){
    if (memoryStatus) memoryStatus.textContent = memoria.length ? memoria.length + " ITEMS" : "READY";
    if (memoryMeter) memoryMeter.style.width = Math.min(100, memoria.length * 5) + "%";
}
actualizarMemoriaUI();

let jarvisActivo = false;
let personalidad = "directo";



function guardarMemoria(dato){


memoria.push(dato.trim());



if(memoria.length > 20){

memoria.shift();

}

localStorage.setItem("JARVIS_MEMORIA", JSON.stringify(memoria));
actualizarMemoriaUI();


}




function comandosJarvis(texto){


texto =
texto.toLowerCase();


if(!jarvisActivo){

    if(texto.includes("jarvis")){

        jarvisActivo = true;

        hablar("A sus órdenes, señor.");

        estado.textContent = "Estado: Activo.";

        setTimeout(()=>{
            jarvisActivo = false;
            estado.textContent = "Estado: En reposo.";
        }, 30000);

    } else {

        estado.textContent = "Estado: Esperando activación...";

    }

    return true;

}


if(texto.includes("jarvis descansa") || texto.includes("jarvis duerme")){

    jarvisActivo = false;

    hablar("Entrando en modo reposo, señor.");

    estado.textContent = "Estado: En reposo.";

    return true;

}


if(texto.includes("modo sarcástico") || texto.includes("modo sarcastico")){

    personalidad = "sarcastico";

    hablar("Ajá, perfecto. Como si yo no tuviera mejores cosas que hacer, señor.");

    return true;

}

if(texto.includes("modo formal")){

    personalidad = "formal";

    hablar("Modo formal activado. Como siempre, a su servicio, señor.");

    return true;

}

if(texto.includes("modo amigable")){

    personalidad = "amigable";

    hablar("¡Genial! Me encanta cuando somos amigos, señor.");

    return true;

}

if(texto.includes("modo misterioso")){

    personalidad = "misterioso";

    hablar("...Los secretos del universo están cerca, señor.");

    return true;

}


if(texto.includes("recuerda que")){


let dato =
texto.replace("recuerda que","");



guardarMemoria(dato);



hablar(
"Información guardada, señor."
);



return true;


}




if(texto.includes("que recuerdas")){


if(memoria.length === 0){


hablar(
"No tengo recuerdos guardados, señor."
);


}

else{


hablar(
"Recuerdo lo siguiente: " +
memoria.join(", ")
);


}



return true;


}




if(texto.includes("quién eres")){


hablar(

"Soy JARVIS, su asistente personal de inteligencia artificial, señor."

);


return true;


}







return false;


}



// ======================================
// FIN PARTE 4
// ======================================


// ======================================
// PARTE 5 DE 5
// ======================================


window.onload = ()=>{


estado.textContent =
"Estado: Sistema iniciado.";



jarvis.textContent =
"JARVIS en línea. Diga 'Jarvis' para activarme, señor.";


};


window.addEventListener("offline",()=>{


estado.textContent =
"Estado: Sin conexión.";



hablar(
"Señor, he perdido la conexión a internet."
);


});




window.addEventListener("online",()=>{


estado.textContent =
"Estado: Conectado.";


});




// ======================================
// JARVIS WEB AI COMPLETADO
// ======================================
