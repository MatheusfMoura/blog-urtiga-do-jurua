// --- INÍCIO DA TRAVA DE SEGURANÇA ---
async function verificarSessao() {
    // Pergunta pro Supabase se tem alguém logado agora
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    // Se não tiver sessão (não estiver logado), manda pro login.html
    if (!session) {
        window.location.replace('login.html'); 
    }
}
verificarSessao(); // Roda a verificação assim que a página abre
// --- FIM DA TRAVA DE SEGURANÇA ---

document.getElementById('form-artigo').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const btnSubmit = document.querySelector('.btn-submit');
    const textoOriginal = btnSubmit.innerText;
    btnSubmit.innerText = 'Fazendo upload e publicando...';
    btnSubmit.disabled = true; 

    const tituloValor = document.getElementById('titulo').value;
    const categoriaValor = document.getElementById('categoria').value;
    const resumoValor = document.getElementById('resumo').value;
    const conteudoValor = document.getElementById('conteudo').value;
    
    // 1. Captura o arquivo de imagem
    const arquivoInput = document.getElementById('imagem_capa');
    const arquivoImagem = arquivoInput.files[0];
    let imagemUrlParaSalvar = null;

    try {
        // 2. Lógica de Upload da Imagem
        if (arquivoImagem) {
            // Cria um nome único para a imagem não sobrescrever outra
            const nomeUnico = Date.now() + '-' + arquivoImagem.name.replace(/\s+/g, '-');

            // Manda para o bucket 'imagens'
            const { data: uploadData, error: uploadError } = await supabaseClient
                .storage
                .from('imagens')
                .upload(nomeUnico, arquivoImagem);

            if (uploadError) throw uploadError;

            // Pega o link público da imagem que acabou de subir
            const { data: publicUrlData } = supabaseClient
                .storage
                .from('imagens')
                .getPublicUrl(nomeUnico);

            imagemUrlParaSalvar = publicUrlData.publicUrl;
        }

        // 3. Salva a matéria na tabela, agora incluindo o link da imagem!
        const { data: artigoInserido, error: dbError } = await supabaseClient
            .from('artigos')
            .insert([
                {
                    titulo: tituloValor,
                    categoria: categoriaValor,
                    resumo: resumoValor,
                    conteudo: conteudoValor,
                    imagem_url: imagemUrlParaSalvar
                }
            ])
            .select(); // IMPORTANTE: Precisamos disso para pegar o ID gerado!

        if (dbError) throw dbError;

        // --- INÍCIO DO AVISO AUTOMÁTICO AO FACEBOOK ---
        if (artigoInserido && artigoInserido.length > 0) {
            const idMateria = artigoInserido[0].id;
            const urlMateria = `https://urtigadojurua.com/artigo.php?id=${idMateria}`;
            
            // ATENÇÃO: Substitua pelo Token que você vai gerar no Meta for Developers
            const accessToken = '3143405609193238|72fc1bbae33fcc79daed1c0a5bf91621'; 
            
            try {
                // Manda o robô do Facebook ler o link invisivelmente
                fetch('https://graph.facebook.com/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        id: urlMateria,
                        scrape: 'true',
                        access_token: accessToken
                    })
                });
            } catch (err) {
                console.log('Aviso ao Facebook falhou em segundo plano.');
            }
        }
        // --- FIM DO AVISO AUTOMÁTICO AO FACEBOOK ---

        alert('Matéria com capa publicada com sucesso!');
        document.getElementById('form-artigo').reset();

    } catch (error) {
        console.error("Erro na publicação:", error.message);
        alert("Erro ao publicar. Detalhes: " + error.message);
    } finally {
        btnSubmit.innerText = textoOriginal;
        btnSubmit.disabled = false;
    }
});

// --- LÓGICA DO TICKER DE COTAÇÕES ---
document.getElementById('form-ticker').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnTicker = document.getElementById('btn-ticker');
    const textoOriginal = btnTicker.innerText;
    btnTicker.innerText = 'Atualizando...';
    btnTicker.disabled = true;

    const textoTickerValor = document.getElementById('texto_ticker').value;

    try {
        // Envia o UPDATE para a tabela 'ticker' no registro de ID 1
        const { error } = await supabaseClient
            .from('ticker')
            .update({ texto_cotacoes: textoTickerValor })
            .eq('id', 1);

        if (error) throw error;

        alert('Letreiro do topo atualizado com sucesso!');
        document.getElementById('form-ticker').reset();

    } catch (error) {
        console.error("Erro ao atualizar ticker:", error.message);
        alert("Erro ao atualizar o letreiro. Detalhes no console.");
    } finally {
        btnTicker.innerText = textoOriginal;
        btnTicker.disabled = false;
    }
});

// --- LÓGICA DE CADASTRO DE PATROCINADORES ---
document.getElementById('form-patrocinador').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnPatroc = document.getElementById('btn-patrocinador');
    const textoOriginal = btnPatroc.innerText;
    btnPatroc.innerText = 'Enviando banner...';
    btnPatroc.disabled = true;

    const nomeValor = document.getElementById('patrocinador_nome').value;
    const linkValor = document.getElementById('patrocinador_link').value;
    const arquivoInput = document.getElementById('patrocinador_imagem');
    const posicaoValor = document.getElementById('posicao-apoiador').value; // <-- Capturando o select
    const arquivoImagem = arquivoInput.files[0];
    let imagemUrlParaSalvar = null;

    try {
        // 1. Faz o upload da imagem pro bucket
        if (arquivoImagem) {
            const nomeUnico = 'banner-' + Date.now() + '-' + arquivoImagem.name.replace(/\s+/g, '-');
            const { error: uploadError } = await supabaseClient
                .storage
                .from('imagens')
                .upload(nomeUnico, arquivoImagem);

            if (uploadError) throw uploadError;

            // Pega a URL pública
            const { data: publicUrlData } = supabaseClient
                .storage
                .from('imagens')
                .getPublicUrl(nomeUnico);

            imagemUrlParaSalvar = publicUrlData.publicUrl;
        }

        // 2. Salva os dados na nova tabela
        const { error: dbError } = await supabaseClient
            .from('patrocinadores')
            .insert([
                {
                    nome: nomeValor,
                    link_destino: linkValor,
                    imagem_url: imagemUrlParaSalvar,
                    posicao: posicaoValor // <-- Enviando para a nova coluna do Supabase
                }
            ]);

        if (dbError) throw dbError;

        alert('Patrocinador cadastrado com sucesso!');
        carregarListaPatrocinadores();
        document.getElementById('form-patrocinador').reset();

    } catch (error) {
        console.error("Erro ao cadastrar patrocinador:", error.message);
        alert("Erro ao cadastrar. Detalhes: " + error.message);
    } finally {
        btnPatroc.innerText = textoOriginal;
        btnPatroc.disabled = false;
    }
});

// --- FUNÇÃO PARA LISTAR PATROCINADORES NO PAINEL ---
async function carregarListaPatrocinadores() {
    const listaDiv = document.getElementById('lista-patrocinadores');
    if (!listaDiv) return;

    const { data, error } = await supabaseClient
        .from('patrocinadores')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        listaDiv.innerHTML = '<p>Erro ao carregar lista.</p>';
        return;
    }

    if (data.length === 0) {
        listaDiv.innerHTML = '<p style="font-size: 0.8rem; color: #555; text-align: center;">Nenhum anúncio ativo no momento.</p>';
        return;
    }

    // Monta a lista com design de dashboard
    listaDiv.innerHTML = data.map(p => `
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--input-bg); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${p.imagem_url}" style="width: 45px; height: 35px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);">
                <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-main);">${p.nome}</span>
            </div>
            <button onclick="excluirPatrocinador(${p.id})" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 4px; padding: 6px 12px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#ef4444'; this.style.color='#fff';" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='#ef4444';">Excluir</button>
        </div>
    `).join('');
}

// --- FUNÇÃO PARA EXCLUIR PATROCINADOR ---
window.excluirPatrocinador = async (id) => {
    if (!confirm("Tem certeza que deseja remover este anúncio do site?")) return;

    const { error } = await supabaseClient
        .from('patrocinadores')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Erro ao excluir: " + error.message);
    } else {
        alert("Anúncio removido!");
        carregarListaPatrocinadores(); // Atualiza a lista na hora
    }
};

// Inicializa a lista ao abrir a página
document.addEventListener('DOMContentLoaded', () => {
    carregarListaPatrocinadores();
    carregarDadosPerfil(); 
});

// --- LÓGICA DE ATUALIZAÇÃO DO PERFIL DO EDITOR ---
document.getElementById('form-perfil').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnPerfil = document.getElementById('btn-perfil');
    const textoOriginal = btnPerfil.innerText;
    btnPerfil.innerText = 'Salvando Perfil...';
    btnPerfil.disabled = true;

    const nomeValor = document.getElementById('perfil_nome').value;
    const linkValor = document.getElementById('perfil_link').value;
    const bioValor = document.getElementById('perfil_bio').value;
    const arquivoInput = document.getElementById('perfil_imagem');
    const arquivoImagem = arquivoInput.files[0];

    try {
        let dadosParaAtualizar = {
            nome: nomeValor,
            link_redes: linkValor,
            biografia: bioValor
        };

        if (arquivoImagem) {
            const nomeUnico = 'perfil-' + Date.now() + '-' + arquivoImagem.name.replace(/\s+/g, '-');
            const { error: uploadError } = await supabaseClient
                .storage
                .from('imagens')
                .upload(nomeUnico, arquivoImagem);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabaseClient
                .storage
                .from('imagens')
                .getPublicUrl(nomeUnico);

            dadosParaAtualizar.imagem_url = publicUrlData.publicUrl;
        }

        const { error: dbError } = await supabaseClient
            .from('perfil_editor')
            .update(dadosParaAtualizar)
            .eq('id', 1);

        if (dbError) throw dbError;

        alert('Perfil do editor atualizado com sucesso!');
        arquivoInput.value = ''; // Limpa o campo de arquivo após subir

    } catch (error) {
        console.error("Erro ao atualizar perfil:", error.message);
        alert("Erro ao salvar. Detalhes: " + error.message);
    } finally {
        btnPerfil.innerText = textoOriginal;
        btnPerfil.disabled = false;
    }
});

// --- FUNÇÃO PARA CARREGAR OS DADOS DO PERFIL NO PAINEL ---
async function carregarDadosPerfil() {
    try {
        const { data, error } = await supabaseClient
            .from('perfil_editor')
            .select('*')
            .eq('id', 1)
            .single();

        if (data) {
            document.getElementById('perfil_nome').value = data.nome || '';
            document.getElementById('perfil_link').value = data.link_redes || '';
            document.getElementById('perfil_bio').value = data.biografia || '';
        }
    } catch (error) {
        console.error("Erro ao carregar os dados no form do perfil.");
    }
}

// --- LÓGICA DE PRÉ-VISUALIZAÇÃO DA MATÉRIA ---
document.getElementById('btn-preview').addEventListener('click', () => {
    const titulo = document.getElementById('titulo').value;
    const categoria = document.getElementById('categoria').value;
    const conteudo = document.getElementById('conteudo').value;
    const resumo = document.getElementById('resumo').value;
    const arquivoInput = document.getElementById('imagem_capa');

    if (!titulo || !categoria || !conteudo) {
        alert('Preencha pelo menos o título, a categoria e o texto completo para pré-visualizar!');
        return;
    }

    // Função que salva os dados temporariamente e abre a nova aba
    const abrirPreview = (imagemBase64) => {
        const previewData = {
            titulo: titulo,
            categoria: categoria,
            conteudo: conteudo,
            resumo: resumo,
            imagem_url: imagemBase64,
            created_at: new Date().toISOString()
        };
        
        // Salva na memória rápida do navegador
        localStorage.setItem('preview_urtiga', JSON.stringify(previewData));
        
        // Abre a página real do artigo passando um aviso de preview na URL
        window.open('artigo.php?preview=true', '_blank');
    };

    // Lê a imagem do computador do cliente em formato texto (base64) sem fazer upload pro Supabase
    if (arquivoInput.files && arquivoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            abrirPreview(e.target.result);
        };
        reader.readAsDataURL(arquivoInput.files[0]);
    } else {
        abrirPreview(null);
    }
});