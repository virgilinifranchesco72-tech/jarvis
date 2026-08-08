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
reconocimiento.continuous = false;



function obtenerVozNatural(){
    const voces = speechSynthesis.getVoices();
    const vocesEspanol = voces.filter(voz => voz.lang.toLowerCase().startsWith("es"));
    const preferidas = ["Google español", "Microsoft Dalia", "Microsoft Jorge", "Paulina", "Mónica", "Monica", "Google español de Estados Unidos"];

    return preferidas.reduce((encontrada, nombre) => {
        return encontrada || vocesEspanol.find(voz => voz.name.toLowerCase().includes(nombre.toLowerCase()));
    }, null) || vocesEspanol.find(voz => voz.lang.toLowerCase() === "es-ar") || vocesEspanol[0];
}

speechSynthesis.onvoiceschanged = () => obtenerVozNatural();

function hablar(texto){

    speechSynthesis.cancel();


    const voz = new SpeechSynthesisUtterance(texto);
    const vozNatural = obtenerVozNatural();

    if (vozNatural) voz.voice = vozNatural;
    voz.lang = vozNatural?.lang || "es-AR";
    voz.rate = 0.94;
    voz.pitch = 1.02;
    voz.volume = 1;


    jarvis.textContent = texto;


    voz.onstart = () => waveform.classList.add("active");
    voz.onend = () => waveform.classList.remove("active");
    speechSynthesis.speak(voz);

}



boton.addEventListener("click",()=>{


    estado.textContent =
    "Estado: Escuchando...";
    waveform.classList.add("active");


    reconocimiento.start();


});



// ======================================
// FIN PARTE 1
// ======================================

// ======================================
// PARTE 2 DE 5
// ======================================

async function preguntarGemini(pregunta){

    const perfiles = {
        formal: `Eres JARVIS, un asistente inspirado en Iron Man. Hablas de forma seria, elegante y profesional. Llama al usuario "señor".`,
        sarcastico: `Eres JARVIS, pero con un humor sarcástico e irónico. Siempre respondes con alguna pulla o comentario ácido, pero igual ayudas. Llama al usuario "señor".`,
        amigable: `Eres JARVIS, muy amigable, entusiasta y positivo. Usas un tono cálido y cercano. Llama al usuario "señor".`,
        misterioso: `Eres JARVIS, pero hablas de forma críptica, filosófica y misteriosa. Das respuestas profundas. Llama al usuario "señor".`
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


reconocimiento.onend = () => waveform.classList.remove("active");


reconocimiento.onresult = async(evento)=>{


const texto =
evento.results[0][0].transcript;



usuario.textContent =
texto;



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
