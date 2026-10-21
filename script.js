let resultado = 0;
let alternativas = [];

let pontos1 = 0;
let pontos2 = 0;

let nomeP1 = "Jogador 1";
let nomeP2 = "Jogador 2";

let tempo = 30;
let intervalo;

let jogoAtivo = false;
let modo = 1;
let jogadorAtual = 1;
let acertosNoTurno = 0;

let rodada = 1;
let pergunta = 1;
let maxRodadas = 10;

let combo = 0;
let maxCombo = 0;
let dificuldade = 1;

let recorde = parseInt(localStorage.getItem("golMatematicoRecorde")) || 0;

let inicioPergunta = 0;
let temposResposta = [];
let acertos = 0;
let erros = 0;

// ================= SONS (gerados por código, sem arquivos externos) =================
let audioCtx = null;
let torcidaNode = null;

function getAudioCtx(){
    if(!audioCtx){
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if(audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
}

function tocarTom(freq, duracao, tipo, volume){
    try{
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = tipo;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracao);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duracao);
    }catch(e){}
}

function somClique(){
    tocarTom(440, 0.05, "sine", 0.15);
}

function tocarAudio(id, fallback){
    const audio = document.getElementById(id);
    if(!audio) return fallback();

    audio.currentTime = 0;
    const reproducao = audio.play();
    if(reproducao){
        reproducao.catch(() => fallback());
    }
}

function somHover(){
    tocarTom(880, 0.03, "sine", 0.05);
}

function somChute(){
    try{
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }catch(e){}
}

function somGol(){
    tocarAudio("audio1", () => {});
}

function somGolGerado(){
    const notas = [523.25, 659.25, 783.99, 1046.5];
    notas.forEach((freq, i)=>{
        setTimeout(()=> tocarTom(freq, 0.35, "triangle", 0.35), i*90);
    });
    somTorcidaGol();
}

function somAssobioBola(){
    try{
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(700, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1500, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    }catch(e){}
}

function somTorcidaGol(){
    try{
        const ctx = getAudioCtx();
        const bufferSize = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for(let i = 0; i < bufferSize; i++){
            output[i] = (Math.random() * 2 - 1);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filtro = ctx.createBiquadFilter();
        filtro.type = "bandpass";
        filtro.frequency.value = 1000;
        filtro.Q.value = 0.6;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);

        noise.connect(filtro);
        filtro.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
        noise.stop(ctx.currentTime + 1.1);
    }catch(e){}
}

function somTique(agudo){
    tocarTom(agudo ? 1200 : 900, 0.06, "square", 0.12);
}

function somFimDeJogo(vitoria){
    tocarAudio("audio2", () => {});
}

function somFimDeJogoGerado(vitoria){
    const notasVitoria = [523.25, 587.33, 659.25, 783.99, 1046.5];
    const notasNeutro = [440, 415.3, 392];
    const notas = vitoria ? notasVitoria : notasNeutro;
    notas.forEach((freq, i)=>{
        setTimeout(()=> tocarTom(freq, 0.4, "triangle", 0.3), i*140);
    });
}

function somDefesa(){
    try{
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }catch(e){}
}

function iniciarTorcida(){
    try{
        const ctx = getAudioCtx();
        if(torcidaNode) return;

        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for(let i = 0; i < bufferSize; i++){
            output[i] = (Math.random() * 2 - 1) * 0.6;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filtro = ctx.createBiquadFilter();
        filtro.type = "bandpass";
        filtro.frequency.value = 700;
        filtro.Q.value = 0.5;

        const gain = ctx.createGain();
        gain.gain.value = 0.045;

        noise.connect(filtro);
        filtro.connect(gain);
        gain.connect(ctx.destination);
        noise.start();

        torcidaNode = { noise, gain };
    }catch(e){}
}

function pararTorcida(){
    if(torcidaNode){
        try{ torcidaNode.noise.stop(); }catch(e){}
        torcidaNode = null;
    }
}

function vibrarAcerto(){
    if(navigator.vibrate) navigator.vibrate(60);
}

function vibrarErro(){
    if(navigator.vibrate) navigator.vibrate([40,60,40]);
}

// ================= TELA INICIAL / NOMES ================= 
function atualizarRecordeDisplay(){
    const el = document.getElementById("recordeDisplay");
    if(recorde > 0){
        el.style.display = "block";
        el.innerHTML = `🏆 Seu recorde: ${recorde} pontos`;
    }
}

function prepararJogo(m){
    somClique();
    if(m === 1){
        nomeP1 = "Você";
        iniciarJogo(1);
    } else {
        document.getElementById("tela-nomes").style.display = "flex";
    }
}

function confirmarNomes(){
    somClique();
    nomeP1 = document.getElementById("nomeJogador1").value.trim() || "Jogador 1";
    nomeP2 = document.getElementById("nomeJogador2").value.trim() || "Jogador 2";
    document.getElementById("tela-nomes").style.display = "none";
    iniciarJogo(2);
}

function novaConta(){

    let a,b,op;
    let tipo = parseInt(document.getElementById("tipoConta").value);

    // Dificuldade progressiva + dificuldade adaptativa (combo alto = perguntas um pouco mais difíceis)
    let bonusCombo = Math.floor(combo / 3);

    let minA = 1 + (rodada * dificuldade) + (bonusCombo * 2);
    let maxA = 30 + (rodada * dificuldade * 2) + (bonusCombo * 4);
    let minB = 1 + (dificuldade) + Math.floor(bonusCombo / 2);
    let maxB = 20 + (dificuldade * 3) + (bonusCombo * 2);

    if(tipo === 1){
        a = rand(minA, maxA);
        b = rand(minB, maxB);
        op = Math.random() < 0.5 ? "+" : "-";
        resultado = op == "+" ? a+b : a-b;
    } else if(tipo === 2) {
        a = rand(Math.max(1, minA/2), Math.max(5, maxA/3));
        b = rand(Math.max(1, minB/2), Math.max(5, maxB/3));
        op = "×";
        resultado = a*b;
    } else {
        a = rand(minA, maxA);
        b = rand(minB, maxB);
        op = Math.random() < 0.5 ? Math.random() < 0.5 ? "+" : "-" : "×";
        resultado = op == "+" ? a+b : op == "-" ? a-b : a*b;
    }

    alternativas = [resultado];

    while(alternativas.length < 3){
        let errado = resultado + rand(-20 * dificuldade, 20 * dificuldade);
        if(!alternativas.includes(errado) && errado !== resultado) alternativas.push(errado);
    }

    alternativas.sort(()=>Math.random()-0.5);

    document.getElementById("conta").innerHTML =
        `<div class="rodada-info">Rodada ${rodada} / ${maxRodadas}</div>
         <div class="conta-math">${a} ${op} ${b} = ?</div>`;

    for(let i=0;i<3;i++){
        document.getElementById("alt"+i).innerHTML = alternativas[i];
    }

    inicioPergunta = Date.now();
}

function responder(i,jogador){

    if(!jogoAtivo) return;

    jogador = modo === 2 ? jogadorAtual : jogador;

    let tempoDeResposta = (Date.now() - inicioPergunta) / 1000;
    temposResposta.push(tempoDeResposta);

    if(alternativas[i] != resultado){
        erros++;
        vibrarErro();

        let bola = document.getElementById("bola");
        let gol = document.getElementById("goleiro");

        bola.style.left = "46.9%";
        bola.style.bottom = "65%";
        tocarAudio("audio3", () => {});
        bola.classList.add("chute");

        gol.style.left = "calc(47.7% - clamp(28px, 3.9%, 50px) / 2)";
        gol.classList.add("defendendo");
        gol.classList.add("dive-center");

        document.getElementById("mensagem").innerHTML = "❌ Errou! 🧤 Goleiro salvou!";
        combo = 0;
        document.getElementById("combo").style.display = "none";

        reset(700, true);
        return;
    }

    acertos++;
    combo++;
    maxCombo = Math.max(maxCombo, combo);
    document.getElementById("combo").style.display = "block";
    document.getElementById("comboCount").innerHTML = combo;

    let bola = document.getElementById("bola");
    let gol = document.getElementById("goleiro");
    const goleiroVaiParaEsquerda = Math.random() < 0.5;

    bola.style.left = goleiroVaiParaEsquerda ? "56%" : "38%";
    bola.style.bottom = "78%";
    gol.classList.add(goleiroVaiParaEsquerda ? "dive-left" : "dive-right");
    tocarAudio("audio3", () => {});
    bola.classList.add("chute");

    setTimeout(()=>{

        let mensagem = document.getElementById("mensagem");

        somGol();
        vibrarAcerto();
        mensagem.innerHTML = `⚽ GOL! 🎉<br><span style="font-size:16px">Combo: ${combo}x🔥</span>`;
        mensagem.classList.add("goal-animation");
        criarParticulas();
        
        if(jogador == 1) pontos1 += combo;
        else pontos2 += combo;

        acertosNoTurno++;
        const trocarJogador = modo === 2 && acertosNoTurno >= 5;

        atualizarPlacar();
        reset(1000, trocarJogador);
        bola.classList.remove("chute");
        gol.classList.remove("defendendo");

    },500);
}

function criarParticulas(){
    let container = document.getElementById("particulas");
    for(let i = 0; i < 40; i++){
        let particula = document.createElement("div");
        particula.className = "particula";
        particula.style.left = "50%";
        particula.style.top = "18%";
        particula.style.setProperty("--tx-value", (Math.random() - 0.5) * 3);
        particula.style.setProperty("--ty-value", (Math.random() - 0.5) * 3 - 1);
        particula.innerHTML = ["⭐", "✨", "🎉", "🔥", "⚽", "💫", "🌟"][Math.floor(Math.random() * 7)];
        container.appendChild(particula);
        
        setTimeout(() => particula.remove(), 1500);
    }
}

function reset(delay = 1000, passarVez = false){
    setTimeout(()=>{
        const bola = document.getElementById("bola");
        const goleiro = document.getElementById("goleiro");
        const mensagem = document.getElementById("mensagem");

        bola.style.bottom = "9.2%";
        bola.style.left = "46.9%";
        goleiro.style.left = "calc(47.7% - clamp(28px, 3.9%, 50px) / 2)";
        bola.classList.remove("chute");
        goleiro.classList.remove("defesa");
        goleiro.classList.remove("defendendo");
        goleiro.classList.remove("dive-left");
        goleiro.classList.remove("dive-right");
        goleiro.classList.remove("dive-center");
        mensagem.classList.remove("goal-animation");

        next(passarVez);
    },delay);
}

function next(passarVez = false){

    rodada++;

    if(modo === 2 && passarVez){
        jogadorAtual = jogadorAtual === 1 ? 2 : 1;
        acertosNoTurno = 0;
        combo = 0;
        document.getElementById("combo").style.display = "none";
    }

    if(rodada > maxRodadas){
        fim();
        return;
    }

    document.getElementById("mensagem").innerHTML = "";
    atualizarIndicadorTurno();
    novaConta();
}

function iniciarJogo(m){

    modo = m;
    jogoAtivo = true;

    dificuldade = parseInt(document.getElementById("dificuldade").value);
    maxRodadas = parseInt(document.getElementById("inputRodadas").value);

    document.getElementById("tela-inicial").style.display = "none";
    document.getElementById("tela-nomes").style.display = "none";
    document.getElementById("placar").style.display = "flex";
    document.getElementById("cronometro").style.display = "block";
    document.getElementById("combo").style.display = "none";

    document.querySelector(".player-1 .player-badge").innerHTML = `🔵 ${nomeP1}`;
    document.querySelector(".player-2 .player-badge").innerHTML = `🔴 ${nomeP2}`;
    document.getElementById("caixaP2").style.display = m === 2 ? "" : "none";
    document.querySelector(".versus").style.display = m === 2 ? "" : "none";
    pontos1 = 0;
    pontos2 = 0;
    combo = 0;
    maxCombo = 0;
    rodada = 1;
    jogadorAtual = 1;
    acertosNoTurno = 0;
    tempo = 30;

    temposResposta = [];
    acertos = 0;
    erros = 0;

    atualizarIndicadorTurno();

    getAudioCtx();
    atualizarPlacar();
    novaConta();
    timer();
}

function timer(){

    intervalo = setInterval(()=>{

        if(!jogoAtivo) return;

        tempo--;

        document.getElementById("tempoAtual").innerHTML = tempo;
        let cronometro = document.getElementById("cronometro");

        // Cor do cronômetro muda gradualmente de verde pra vermelho conforme o tempo acaba
        let progresso = Math.max(0, Math.min(1, tempo / 30));
        let hue = Math.round(progresso * 120);
        cronometro.style.background = `linear-gradient(135deg, hsl(${hue},85%,55%), hsl(${hue},85%,42%))`;
        
        if(tempo <= 5){
            cronometro.classList.add("pouco-tempo");
            if(tempo > 0) somTique(tempo <= 2);
        } else {
            cronometro.classList.remove("pouco-tempo");
        }

        if(tempo <= 0){
            tempo = 30;
            combo = 0;
            document.getElementById("combo").style.display = "none";
            next(true);
        }

    },1000);
}

function atualizarPlacar(){
    document.getElementById("pontos1").innerHTML = pontos1;
    document.getElementById("pontos2").innerHTML = pontos2;
}

function atualizarIndicadorTurno(){
    const indicador = document.getElementById("indicadorTurno");
    const nome = document.getElementById("nomeJogadorTurno");
    const placarJogador1 = document.querySelector(".player-1");
    const placarJogador2 = document.querySelector(".player-2");

    if(modo !== 2){
        indicador.style.display = "none";
        placarJogador1.classList.remove("jogador-da-vez");
        placarJogador2.classList.remove("jogador-da-vez");
        return;
    }

    nome.innerHTML = jogadorAtual === 1 ? nomeP1 : nomeP2;
    indicador.style.display = "block";
    placarJogador1.classList.toggle("jogador-da-vez", jogadorAtual === 1);
    placarJogador2.classList.toggle("jogador-da-vez", jogadorAtual === 2);
}

function fim(){

    jogoAtivo = false;

    let msg = "🏁 Fim de Jogo<br>";
    let vitoria = false;

    if(modo === 1){
        let nivelDesempenho = "";
        if(pontos1 >= maxRodadas * 10){ nivelDesempenho = "🥇 Excelente"; vitoria = true; }
        else if(pontos1 >= maxRodadas * 5){ nivelDesempenho = "🥈 Muito Bom"; vitoria = true; }
        else if(pontos1 >= maxRodadas * 2) nivelDesempenho = "🥉 Bom";
        else nivelDesempenho = "📚 Continue Treinando";

        let recordeBatido = "";
        if(pontos1 > recorde){
            recorde = pontos1;
            localStorage.setItem("golMatematicoRecorde", recorde);
            recordeBatido = "<br>🏆 Novo recorde!";
            vitoria = true;
        }
        
        msg += `Pontuação: ${pontos1}<br>Combo Máximo: ${maxCombo}x🔥<br>${nivelDesempenho}${recordeBatido}`;
    } else {
        if(pontos1 > pontos2){ msg += `🏆 ${nomeP1} Venceu!<br>${nomeP1}: ${pontos1} x ${pontos2} :${nomeP2}`; vitoria = true; }
        else if(pontos2 > pontos1){ msg += `🏆 ${nomeP2} Venceu!<br>${nomeP1}: ${pontos1} x ${pontos2} :${nomeP2}`; vitoria = true; }
        else msg += `⚖️ Empate!<br>${nomeP1}: ${pontos1} x ${pontos2} :${nomeP2}`;
    }

    let totalRespostas = temposResposta.length;
    let tempoMedio = totalRespostas > 0
        ? (temposResposta.reduce((a,b)=>a+b,0) / totalRespostas).toFixed(1)
        : "0";
    let totalTentativas = acertos + erros;
    let precisao = totalTentativas > 0 ? Math.round((acertos / totalTentativas) * 100) : 0;

    msg += `<br><span style="font-size:14px">⏱️ Tempo médio: ${tempoMedio}s &nbsp;|&nbsp; 🎯 Precisão: ${precisao}%</span>`;
    msg += `<br><button id="btnJogarNovamente" class="btn-primary" style="max-width:260px;margin:14px auto 0 auto;font-size:14px;padding:12px 18px;" onclick="location.reload()">🔄 Jogar Novamente</button>`;

    let mensagem = document.getElementById("mensagem");
    mensagem.innerHTML = msg;
    mensagem.style.animation = "pulsar 1s ease";

    criarParticulas();
    clearInterval(intervalo);
    pararTorcida();
    somFimDeJogo(vitoria);

    // Rola a tela suavemente até o botão de jogar novamente, pra garantir que o usuário veja
    setTimeout(()=>{
        const botao = document.getElementById("btnJogarNovamente");
        if(botao) botao.scrollIntoView({behavior:"smooth", block:"center"});
    }, 150);
}

function rand(min,max){
    return Math.floor(Math.random()*(max-min+1))+min;
}

// ================= SOM NOS BOTÕES (clique e hover) =================
document.addEventListener("DOMContentLoaded", ()=>{
    atualizarRecordeDisplay();

    document.querySelectorAll(".btn-primary").forEach(btn=>{
        btn.addEventListener("mouseenter", somHover);
    });

    document.querySelectorAll(".alternativas button").forEach(btn=>{
        btn.addEventListener("mouseenter", somHover);
    });

    document.querySelectorAll("#tela-inicial h1, #tela-inicial p, #tela-inicial .subtitle, #tela-inicial label").forEach(texto=>{
        texto.addEventListener("mouseenter", somHover);
    });
});