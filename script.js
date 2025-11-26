import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, onSnapshot, getDoc } from "./firebase/firebase.js";

// ======================================================
// 1. UTILITÁRIOS GERAIS (Login e Sessão)
// ======================================================


// Pega o ID do usuário salvo na sessão (navegador)
function getMyID() {
    return sessionStorage.getItem("usuarioLogadoID");
}

function getMyName() {
    return sessionStorage.getItem("usuarioNome");
}

// Verifica se está logado (proteção de rotas)
// Verifica se está logado (proteção de rotas)
function verificarAutenticacao() {
    const path = window.location.pathname;
    
    // 1. Se estiver na tela de login (index), libera geral
    if (path.includes("index.html") || path.endsWith("/")) return;

    // 2. Se estiver na página do Admin
    if (path.includes("adminhome.html")) {
        // Se NÃO tiver a credencial de admin, chuta pra fora
        if (sessionStorage.getItem("adminLogado") !== "true") {
            window.location.href = "index.html";
        }
        return; // Se tiver a credencial, deixa ficar
    }

    // 3. Para todas as outras páginas (home, pag2, etc), precisa de login de usuário normal
    if (!getMyID()) {
        window.location.href = "index.html";
    }
}
verificarAutenticacao();

// Botão SAIR (funciona em Home, Pag2, etc)
const btnSair = document.getElementById("btnSair");
if (btnSair) {
    btnSair.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "index.html";
    });
}

const btnVoltarHome = document.getElementById("btnVoltarHome");
if (btnVoltarHome) {
    btnVoltarHome.addEventListener("click", () => window.location.href = "home.html");
}
// ===========================================
// NOVO: LÓGICA DE POP-UPS (PERSONALIDADE E HOBBY)
// ===========================================

// --- Funcionalidade de Popup Personalidade ---
const btnAbrirPersonalidade = document.getElementById("btnAbrirPersonalidade");
const personalidadeCheckboxes = document.getElementById("personalidadeCheckboxes");

if (btnAbrirPersonalidade && personalidadeCheckboxes) {
  btnAbrirPersonalidade.addEventListener("click", (e) => {
    e.stopPropagation(); // Impede que o clique seja propagado e feche imediatamente
    personalidadeCheckboxes.classList.toggle("escondido");
  });
  
  // Fechar ao clicar fora do container
  document.addEventListener("click", (e) => {
      const persContainer = document.querySelector(".personalidade-selection-container");
      if (persContainer && !persContainer.contains(e.target) && !personalidadeCheckboxes.classList.contains("escondido")) {
          personalidadeCheckboxes.classList.add("escondido");
      }
  });
}

// --- Funcionalidade de Popup Hobby ---
const btnAbrirHobby = document.getElementById("btnAbrirHobby");
const hobbyCheckboxes = document.getElementById("hobbyCheckboxes");

if (btnAbrirHobby && hobbyCheckboxes) {
  btnAbrirHobby.addEventListener("click", (e) => {
    e.stopPropagation(); // Impede que o clique seja propagado e feche imediatamente
    hobbyCheckboxes.classList.toggle("escondido");
  });
  
  // Fechar ao clicar fora
  document.addEventListener("click", (e) => {
      const hobbyContainer = document.querySelector(".hobby-selection-container");
      if (hobbyContainer && !hobbyContainer.contains(e.target) && !hobbyCheckboxes.classList.contains("escondido")) {
          hobbyCheckboxes.classList.add("escondido");
      }
  });
}

// ===========================================
// FIM DA LÓGICA DE POP-UPS
// ===========================================
// ======================================================
// 2. TELA DE LOGIN / CADASTRO (index.html)
// ======================================================
const cadastroBox = document.getElementById("cadastroBox");

// *** A FUNÇÃO getMultipleSelectValues FOI REMOVIDA, NÃO É MAIS NECESSÁRIA ***

if (cadastroBox) { // Estamos na tela de Login/Cadastro
    const loginBox = document.getElementById("loginBox");
    
    // Alternar visualização (mantido)
    document.getElementById("btnMostrarLogin").addEventListener("click", () => {
        cadastroBox.classList.add("escondido");
        loginBox.classList.remove("escondido");
    });
    
    document.getElementById("btnMostrarCadastro").addEventListener("click", () => {
        loginBox.classList.add("escondido");
        cadastroBox.classList.remove("escondido");
    });

  // --- CADASTRAR (CÓDIGO SUBSTITUÍDO) ---
document.getElementById("btnCadastrar").addEventListener("click", async () => {
    // Campos de Input Simples
    const nome = document.getElementById("cadNome").value.trim();
    const senha = document.getElementById("cadSenha").value.trim();
    
    // Leitura do campo de Seleção Única (Cor)
    const cor = document.getElementById("cadCor").value;

    // 1. Coletar Personalidades (Múltipla Escolha)
    const selectedPersonalidadeInputs = document.querySelectorAll('#personalidadeCheckboxes input[name="personalidade"]:checked');
    const selectedPersonalidades = Array.from(selectedPersonalidadeInputs).map(input => input.value);
    
    // 2. Coletar Hobbies (Múltipla Escolha)
    const selectedHobbyInputs = document.querySelectorAll('#hobbyCheckboxes input[name="hobby"]:checked');
    const selectedHobbies = Array.from(selectedHobbyInputs).map(input => input.value);

    // Validação Mínima
    if (!nome || !senha) return alert("Preencha nome e senha!");
    if (!cor) return alert("Por favor, escolha sua Cor Favorita.");
    
    // Validação Personalidade (Múltipla)
    if (selectedPersonalidades.length === 0) {
        alert("Por favor, selecione pelo menos uma personalidade.");
        // Tenta reabrir o pop-up
        const personalidadeCheckboxes = document.getElementById("personalidadeCheckboxes");
        if (personalidadeCheckboxes) personalidadeCheckboxes.classList.remove("escondido"); 
        return; 
    }

    // Validação Hobby (Múltipla)
    if (selectedHobbies.length === 0) {
        alert("Por favor, selecione pelo menos um interesse/hobby.");
        // Tenta reabrir o pop-up
        const hobbyCheckboxes = document.getElementById("hobbyCheckboxes");
        if (hobbyCheckboxes) hobbyCheckboxes.classList.remove("escondido"); 
        return; 
    }

    try {
        // Verifica se nome já existe (mantido)
        const q = query(collection(db, "usuarios"), where("nome", "==", nome));
        const consulta = await getDocs(q);
        
        if (!consulta.empty) {
            return alert("Já existe um usuário com esse nome.");
        }

        // Cria usuário no Banco (AGORA SALVANDO PERSONALIDADE E HOBBY COMO ARRAYS)
        const docRef = await addDoc(collection(db, "usuarios"), {
            nome: nome,
            senha: senha,
            hobby: selectedHobbies, // <<-- ARRAY
            cor: cor,
            personalidade: selectedPersonalidades, // <<-- ARRAY
            saldo: 1000,
            historico: [],
            amigoSorteado: "",  
            foiSorteado: false  
        });

        // Salva na sessão e entra (mantido)
        sessionStorage.setItem("usuarioLogadoID", docRef.id);
        sessionStorage.setItem("usuarioNome", nome);
        alert("Cadastrado com sucesso!");
        window.location.href = "home.html";

    } catch (error) {
        console.error(error);
        alert("Erro ao cadastrar. Verifique o console.");
    }
});
// --- FIM DO CADASTRAR ---
    // --- LOGIN ---
    document.getElementById("btnLogin").addEventListener("click", async () => {
        const nome = document.getElementById("loginNome").value.trim();
        const senha = document.getElementById("loginSenha").value.trim();

        try {
            const q = query(collection(db, "usuarios"), where("nome", "==", nome));
            const consulta = await getDocs(q);

            let logado = false;
            consulta.forEach((doc) => {
                if (doc.data().senha === senha) {
                    sessionStorage.setItem("usuarioLogadoID", doc.id);
                    sessionStorage.setItem("usuarioNome", doc.data().nome);
                    logado = true;
                    window.location.href = "home.html";
                }
            });

            if (!logado) alert("Nome ou senha incorretos.");

        } catch (e) {
            console.error(e);
            alert("Erro no login.");
        }
    });

// --- ADMIN ---
    const btnAdminAbrir = document.getElementById("btnAdminAbrir");
    if (btnAdminAbrir) {
        btnAdminAbrir.addEventListener("click", () => {
            const box = document.getElementById("adminSenhaBox");
            if (box) box.style.display = "flex";
        });
    }

    const btnAdminConfirmar = document.getElementById("btnAdminConfirmar");
    if (btnAdminConfirmar) {
        btnAdminConfirmar.addEventListener("click", () => {
            const senhaAdmin = document.getElementById("adminSenha").value;
            
            if (senhaAdmin === "369") {
                // AQUI ESTÁ O TRUQUE: Salvamos que o admin entrou
                sessionStorage.setItem("adminLogado", "true");
                window.location.href = "adminhome.html";
            } else {
                alert("Senha incorreta");
            }
        });
    }
}
// ======================================================
// 3. SORTEIO (pag.html)
// ======================================================
const btnSortear = document.getElementById("btnSortear");
if (btnSortear) {
    const resultadoDiv = document.getElementById("resultado");

    // Verifica se já sorteou ao carregar
    async function checarSorteio() {
        const meuID = getMyID();
        const meuDoc = await getDoc(doc(db, "usuarios", meuID));
        const meusDados = meuDoc.data();

        if (meusDados.amigoSorteado) {
            // Já sorteou, busca os dados do amigo
            const amigoDoc = await getDoc(doc(db, "usuarios", meusDados.amigoSorteado));
            mostrarResultado(amigoDoc.data());
            btnSortear.disabled = true;
            btnSortear.innerText = "Sorteio Realizado";
        }
    }
    checarSorteio();

    btnSortear.addEventListener("click", async () => {
        const meuID = getMyID();
        
        // Pega todos os usuários
        const snapshot = await getDocs(collection(db, "usuarios"));
        const todos = [];
        snapshot.forEach(d => todos.push({id: d.id, ...d.data()}));

        // Filtra candidatos: Não pode ser eu mesmo, e não pode ser quem já foi sorteado
        const candidatos = todos.filter(u => u.id !== meuID && u.foiSorteado === false);

        if (candidatos.length === 0) {
            return alert("Não há ninguém disponível para sortear agora (ou todos já foram sorteados).");
        }

        // Sorteia
        const sorteado = candidatos[Math.floor(Math.random() * candidatos.length)];

        // Atualiza no Banco (Eu marquei quem sorteei, O amigo marca que foi sorteado)
        await updateDoc(doc(db, "usuarios", meuID), { amigoSorteado: sorteado.id });
        await updateDoc(doc(db, "usuarios", sorteado.id), { foiSorteado: true });

        mostrarResultado(sorteado);
        btnSortear.disabled = true;
    });

    function mostrarResultado(amigo) {
        resultadoDiv.innerHTML = `
            <h3>Você tirou: <span style="color:#ffcc00">${amigo.nome}</span></h3>
            <p>Hobby: ${amigo.hobby}</p>
            <p>Cor: ${amigo.cor}</p>
            <p>Dica: ${amigo.personalidade}</p>
        `;
    }
}

// ======================================================
// 4. CEIA (pag2.html) - TEMPO REAL
// ======================================================
const listaPratos = document.getElementById("listaPratos");
if (listaPratos) {
    const inputPrato = document.getElementById("inputPrato");
    const btnAddPrato = document.getElementById("btnAdicionar");

    // Escuta mudanças no banco em Tempo Real
    onSnapshot(collection(db, "ceia"), (snapshot) => {
        listaPratos.innerHTML = "";
        snapshot.forEach((docItem) => {
            const item = docItem.data();
            const li = document.createElement("li");
            li.innerHTML = `<strong>${item.prato}</strong> <br><small>Levado por: ${item.dono}</small>`;
            
            // Se fui eu que criei, posso apagar
            if (item.donoID === getMyID()) {
                const btnDel = document.createElement("button");
                btnDel.innerText = "🗑";
                btnDel.style.marginLeft = "10px";
                btnDel.style.background = "red";
                btnDel.style.padding = "2px 8px";
                btnDel.onclick = () => deleteDoc(doc(db, "ceia", docItem.id));
                li.appendChild(btnDel);
            }
            listaPratos.appendChild(li);
        });
    });

    btnAddPrato.addEventListener("click", async () => {
        if (!inputPrato.value) return;
        await addDoc(collection(db, "ceia"), {
            prato: inputPrato.value,
            dono: getMyName(),
            donoID: getMyID()
        });
        inputPrato.value = "";
    });
}

// ======================================================
// 5. PIX / MOEDAS (pag3.html)
// ======================================================
const saldoValor = document.getElementById("saldoValor");
if (saldoValor) {
    const inputValor = document.getElementById("inputValor");
    const listaHist = document.getElementById("listaHistorico");
    const quemPagaNome = document.getElementById("quemPagaNome");
    
    if (quemPagaNome) quemPagaNome.innerText = getMyName();

    // Carrega dados e fica "ouvindo" atualizações
    onSnapshot(doc(db, "usuarios", getMyID()), (docUser) => {
        const dados = docUser.data();
        saldoValor.innerText = dados.saldo.toFixed(2);
        
        listaHist.innerHTML = "";
        if (dados.historico) {
            dados.historico.forEach(h => {
                const li = document.createElement("li");
                li.innerText = h;
                listaHist.appendChild(li);
            });
        }
    });

    document.getElementById("btnEnviar").addEventListener("click", async () => {
        const valor = parseFloat(inputValor.value);
        if (!valor || valor <= 0) return alert("Valor inválido");

        const ref = doc(db, "usuarios", getMyID());
        const snap = await getDoc(ref);
        const atual = snap.data();

        if (atual.saldo < valor) return alert("Saldo insuficiente!");

        const novoHist = atual.historico || [];
        novoHist.push(`- R$ ${valor} em ${new Date().toLocaleDateString()}`);

        await updateDoc(ref, {
            saldo: atual.saldo - valor,
            historico: novoHist
        });
        inputValor.value = "";
        alert("Enviado com sucesso!");
    });
}

// ======================================================
// 6. ADMIN PAINEL (adminhome.html)
// ======================================================
const listaAdmin = document.getElementById("listaUsuarios");
const btnReset = document.getElementById("btnReset");
const btnSairAdmin = document.getElementById("btnSairAdmin");

if (listaAdmin) {

    // --- FUNÇÃO DE CONTROLE DE MOEDAS (Firebase) ---
    async function controlarMoedas(usuarioID, valor, tipo) {
        // Converte para float e valida
        const valorNumerico = parseFloat(valor);
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
            return alert("Valor inválido. Insira um número maior que zero!");
        }
        
        const ref = doc(db, "usuarios", usuarioID);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return alert("Erro: Usuário não encontrado!");
        }

        const atual = snap.data();
        let novoSaldo = atual.saldo || 0; 
        let historicoMsg = "";

        if (tipo === 'adicionar') {
            novoSaldo = novoSaldo + valorNumerico;
            historicoMsg = `+ R$ ${valorNumerico.toFixed(2)} (Admin: Adição) em ${new Date().toLocaleDateString('pt-BR')}`;
        } else if (tipo === 'remover') {
            if (novoSaldo < valorNumerico) {
                return alert(`Erro: Saldo de ${atual.nome} (R$ ${novoSaldo.toFixed(2)}) é insuficiente para remover R$ ${valorNumerico.toFixed(2)}.`);
            }
            novoSaldo = novoSaldo - valorNumerico;
            historicoMsg = `- R$ ${valorNumerico.toFixed(2)} (Admin: Remoção) em ${new Date().toLocaleDateString('pt-BR')}`;
        } else {
            return; 
        }

        // Prepara o novo histórico
        const novoHist = atual.historico || [];
        novoHist.push(historicoMsg);

        // Atualiza o Banco
        await updateDoc(ref, {
            saldo: novoSaldo,
            historico: novoHist
        });

        alert(`Saldo de ${atual.nome} atualizado para R$ ${novoSaldo.toFixed(2)}.`);
        carregarAdmin(); // Recarrega a lista para mostrar o novo saldo
    }
    // --- FIM FUNÇÃO DE CONTROLE DE MOEDAS ---


    async function carregarAdmin() {
        try {
            listaAdmin.innerHTML = "<li>Carregando usuários...</li>"; 
            const snap = await getDocs(collection(db, "usuarios"));
            
            if (snap.empty) {
                 listaAdmin.innerHTML = "<li>Nenhum usuário cadastrado.</li>";
                 return;
            }

            listaAdmin.innerHTML = ""; 
            
            snap.forEach(docUser => {
                const u = docUser.data();
                const userID = docUser.id;
                const li = document.createElement("li");
                
                // NOVO LAYOUT: Inclui input e botões de controle de saldo
                li.innerHTML = `
                    <span class="userName">${u.nome} (Saldo: R$ ${(u.saldo || 0).toFixed(2)})</span>
                    <div class="coin-control">
                        <input type="number" min="1" step="1" class="input-saldo" placeholder="Valor">
                        <button class="btn-add-coin" data-id="${userID}">➕</button>
                        <button class="btn-remove-coin" data-id="${userID}">➖</button>
                        <button class="btn-del btnRemove" data-id="${userID}">Excluir</button>
                    </div>
                `;
                listaAdmin.appendChild(li);
            });


            // 1. Eventos dos botões de adicionar moeda
            document.querySelectorAll(".btn-add-coin").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const userID = e.target.getAttribute("data-id");
                    // Navega no DOM para encontrar o input mais próximo (dentro do mesmo <li>)
                    const input = e.target.closest('li').querySelector('.input-saldo');
                    await controlarMoedas(userID, input.value, 'adicionar');
                });
            });
            
            // 2. Eventos dos botões de remover moeda
            document.querySelectorAll(".btn-remove-coin").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const userID = e.target.getAttribute("data-id");
                    // Navega no DOM para encontrar o input mais próximo (dentro do mesmo <li>)
                    const input = e.target.closest('li').querySelector('.input-saldo');
                    await controlarMoedas(userID, input.value, 'remover');
                });
            });
            
            // 3. Eventos dos botões excluir (usando a classe btnRemove que está no CSS)
            document.querySelectorAll(".btnRemove").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    if (confirm("Apagar usuário? Esta ação é irreversível.")) {
                        await deleteDoc(doc(db, "usuarios", e.target.getAttribute("data-id")));
                        carregarAdmin(); 
                    }
                });
            });


        } catch (error) {
            console.error("Erro FATAL ao carregar lista de usuários no Admin:", error);
            alert("Erro ao carregar dados do Firebase. Verifique o console (F12) para detalhes.");
            listaAdmin.innerHTML = "<li>Erro FATAL ao carregar dados. Verifique a console.</li>"; 
        }
    }

    // Lógica do botão Reset 
    if (btnReset) {
        btnReset.addEventListener("click", async () => {
            if (confirm("ATENÇÃO: Isso vai resetar todos os sorteios!")) {
                const snap = await getDocs(collection(db, "usuarios"));
                
                // Mapeia todas as atualizações em um array de Promises para execução eficiente
                const updates = snap.docs.map(d => 
                    updateDoc(doc(db, "usuarios", d.id), {
                        amigoSorteado: "",
                        foiSorteado: false
                    })
                );
                await Promise.all(updates);
                
                alert("Sorteio Reiniciado!");
                // Não precisa recarregar lista aqui, mas é bom para garantir.
                // Vou manter o carregarAdmin para garantir.
                carregarAdmin(); 
            }
        });
    }
    
    // Lógica do botão Sair Admin
    if (btnSairAdmin) {
        btnSairAdmin.addEventListener("click", () => {
            sessionStorage.removeItem("adminLogado"); 
            window.location.href = "index.html";
        });
    }
    
    // PASSO CRUCIAL: INICIA A CARGA DOS DADOS!
    carregarAdmin(); 
}
