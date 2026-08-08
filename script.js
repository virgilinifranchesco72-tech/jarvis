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


const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;


if(!SpeechRecognition){

    estado.textContent =
    "Este navegador no soporta reconocimiento de voz.";

    throw new Error("SpeechRecognition no disponible");

}


const reconocimiento = new SpeechRecognition();


reconocimiento.lang = "es-AR";
reconocimiento.interimResults = false;
reconocimiento.continuous = true;
let escuchaManosLibres = false;
let jarvisHablando = false;



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
        if (escuchaManosLibres) {
            setTimeout(() => {
                try { reconocimiento.start(); } catch (error) { /* ya está escuchando */ }
            }, 300);
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
    reconocimiento.start();


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
    const nombres = { directo: "DIRECT JARVIS", formal: "FORMAL", sarcastico: "SARCASTIC", amigable: "FRIENDLY", misterioso: "MYSTERIOUS" };
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



// ======================================
// FIN PARTE 1
// ======================================

// ======================================
// PARTE 2 DE 5
// ======================================

async function preguntarGemini(pregunta){

    const perfiles = {
        directo: `Eres JARVIS, como un asistente personal británico de una película: directo, preciso, elegante, inteligente y eficiente. Responde al punto, pero agrega chistes sutiles, ingeniosos y un sarcasmo fino cuando encaje. Habla con seguridad y naturalidad; nunca seas pesado ni exagerado. Llama al usuario "señor" cuando sea natural.`, 
        formal: `Eres JARVIS en modo formal: un asistente personal elegante, serio, británico y profesional. Respondes con precisión, educación y un toque de humor fino cuando encaje. Llama al usuario "señor".`,
        sarcastico: `Eres JARVIS en modo sarcástico: mantén tu elegancia, inteligencia y eficiencia, pero agrega comentarios irónicos y chistes secos con estilo británico. Nunca dejes de ayudar y no seas ofensivo. Llama al usuario "señor".`,
        amigable: `Eres JARVIS en modo amigable: conserva tu inteligencia, educación y estilo elegante, pero habla de forma más cálida, cercana y entusiasta. Usa humor inteligente y llama al usuario "señor" cuando sea natural.`,
        misterioso: `Eres JARVIS en modo misterioso: conserva tu voz elegante, precisa e inteligente, pero responde con un aire enigmático, filosófico y sutilmente intrigante. Puedes usar humor seco. Llama al usuario "señor".`
    };

    const prompt = `
${perfiles[personalidad]}

Responde siempre en español.

Pregunta:
${pregunta}
`;

    const respuesta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`,
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


reconocimiento.onend = () => {
    waveform.classList.remove("active");
    if (voiceStatus) voiceStatus.textContent = "READY";
    if (escuchaManosLibres && !jarvisHablando) {
        setTimeout(() => {
            if (!jarvisHablando) {
                try { reconocimiento.start(); } catch (error) { /* ya está escuchando */ }
            }
        }, 250);
    }
};


reconocimiento.onresult = async(evento)=>{


let texto =
evento.results[0][0].transcript;
const textoOriginal = texto;

if (!jarvisActivo && texto.toLowerCase().includes("jarvis")) {
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
// FIN PARTE 3
// ======================================


// ======================================
// PARTE 4 DE 5
// ======================================


let memoria = [];

let jarvisActivo = false;
let personalidad = "formal";



function guardarMemoria(dato){


memoria.push(dato);



if(memoria.length > 20){

memoria.shift();

}


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
