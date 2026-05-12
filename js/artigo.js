async function carregarMateriaCompleta() {
    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get('preview');
    const artigoId = urlParams.get('id');

    // 1. MODO PRÉ-VISUALIZAÇÃO (Lê da memória do navegador)
    if (isPreview === 'true') {
        const previewData = JSON.parse(localStorage.getItem('preview_urtiga'));
        
        if (previewData) {
            renderizarDadosArtigo(previewData);
        } else {
            alert("Sessão de pré-visualização expirou ou está vazia.");
        }
        return; // Para a função aqui, não busca no banco!
    }

    // 2. MODO LEITOR NORMAL (Lê do Supabase)
    if (!artigoId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('artigos')
            .select('*')
            .eq('id', artigoId)
            .single();

        if (error) throw error;

        renderizarDadosArtigo(data);

    } catch (error) {
        console.error("Erro ao carregar o artigo:", error.message);
        document.getElementById('materia-titulo').innerText = "Matéria não encontrada";
        document.getElementById('materia-conteudo').innerText = "O dossiê que você está procurando foi removido ou nunca existiu.";
        document.getElementById('materia-categoria').innerText = "ERRO 404";
    }
}

// --- FUNÇÃO AUXILIAR PARA DESENHAR O HTML (Serve para o Preview e para o Banco) ---
function renderizarDadosArtigo(data) {
    // 1. TÍTULO E IMAGEM PARA O WHATSAPP / NAVEGADOR
    const novoTitulo = `${data.titulo} | Rapidinhas com Urtiga do Juruá`;
    document.title = novoTitulo;

    const metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle) metaTitle.setAttribute("content", novoTitulo);

    const metaImage = document.getElementById('meta-image');
    if (metaImage && data.imagem_url) {
        metaImage.setAttribute("content", data.imagem_url);
    }

    // 2. DADOS NORMAIS DA MATÉRIA
    const dataFormatada = new Date(data.created_at).toLocaleDateString('pt-BR');
    
    document.getElementById('materia-categoria').innerText = data.categoria;
    document.getElementById('materia-titulo').innerText = data.titulo;
    document.getElementById('materia-data').innerText = dataFormatada;
    // innerHTML permite que os links ocultos fiquem clicáveis para o leitor
    document.getElementById('materia-conteudo').innerHTML = data.conteudo;
    const containerCapa = document.getElementById('container-capa');
    const imgElement = document.getElementById('materia-imagem');
    const legendaElement = document.getElementById('materia-imagem-legenda');

    if (data.imagem_url) {
        imgElement.src = data.imagem_url;
        legendaElement.innerText = data.imagem_descricao || ""; 
        containerCapa.style.display = 'block';
    } else {
        containerCapa.style.display = 'none';
    }
}

// Executa a função assim que a página carrega
document.addEventListener('DOMContentLoaded', () => {
    carregarMateriaCompleta();
    carregarPatrocinadores();
});

// --- FUNÇÃO PARA CARREGAR OS BANNERS NA LATERAL DA MATÉRIA ---
async function carregarPatrocinadores() {
    const area = document.getElementById('area-patrocinadores');
    if (!area) return;

    try {
        const { data, error } = await supabaseClient
            .from('patrocinadores')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data.length > 0) {
            area.innerHTML = data.map(p => `
                <div style="margin-bottom: 2.5rem; padding: 1rem; box-shadow: 0 5px 15px rgba(0,0,0,0.4); text-align: center; background-color: #111311; border: 1px solid var(--border-color); border-top: 2px solid var(--accent-amber);">
                    <span style="font-family: 'Courier Prime', monospace; font-size: 0.65rem; color: var(--text-secondary); letter-spacing: 2px; display: block; margin-bottom: 8px;">PUBLICIDADE</span>
                    <a href="${p.link_destino}" target="_blank" rel="noopener noreferrer">
                        <img src="${p.imagem_url}" alt="${p.nome}" style="width: 100%; border-radius: 4px; border: 1px solid #000; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                    </a>
                </div>
            `).join('');
        } else {
             area.innerHTML = `
                <div style="margin-bottom: 2.5rem; padding: 1.5rem; text-align: center; background-color: #111311; border: 1px dashed var(--border-color);">
                    <h3 style="color: var(--text-secondary); font-size: 1rem; margin-bottom: 15px;">Patrocínio Regional</h3>
                    <div style="width: 100%; height: 250px; background-color: #171a17; border: 1px dashed var(--border-color); display: flex; align-items: center; justify-content: center; font-family: 'Courier Prime'; font-size: 0.7rem; color: #555;">
                        Espaço para Banner<br>(300x250)<br><br>Anuncie Aqui
                    </div>
                </div>
             `;
        }
    } catch (error) {
        console.error("Erro ao carregar patrocinadores:", error.message);
    }
}
