async function carregarTicker() {
    try {
        const { data, error } = await supabaseClient
            .from('ticker')
            .select('texto_cotacoes')
            .eq('id', 1)
            .single();

        if (error) throw error;

        if (data) {
            const tickerElement = document.querySelector('.ticker-content');
            if (tickerElement) {
                tickerElement.innerHTML = data.texto_cotacoes;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar o ticker do Supabase:", error.message);
    }
}

// --- VARIÁVEL GLOBAL DE PAGINAÇÃO ---
const ITENS_POR_PAGINA = 7;
let paginaAtual = 1;

async function carregarArtigos(termoBusca = '') {
    try {
        const grid = document.querySelector('.articles-grid');
        const heroSection = document.getElementById('hero-section');
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        
        if (!grid) return; 

        grid.innerHTML = '<p style="color: var(--text-secondary); font-family: Courier Prime;">Buscando arquivos na nuvem...</p>';
        if (heroSection && paginaAtual === 1) heroSection.innerHTML = '';

        const limiteInferior = (paginaAtual - 1) * ITENS_POR_PAGINA;
        const limiteSuperior = limiteInferior + ITENS_POR_PAGINA - 1;

        let query = supabaseClient
            .from('artigos')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(limiteInferior, limiteSuperior);

        if (termoBusca) {
            query = query.ilike('titulo', `%${termoBusca}%`);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        grid.innerHTML = '';

        if (data.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-secondary); font-family: Courier Prime;">Nenhum relato encontrado.</p>';
            if (btnPrev) btnPrev.style.display = 'none';
            if (btnNext) btnNext.style.display = 'none';
            return;
        }

        // --- LÓGICA DOS BOTÕES DE PAGINAÇÃO ---
        if (btnPrev && btnNext) {
            // Mostra botão "Anterior" se não estiver na página 1
            btnPrev.style.display = paginaAtual > 1 ? 'block' : 'none';
            
            // Mostra botão "Próximo" se ainda houver matérias sobrando no banco
            btnNext.style.display = (limiteSuperior + 1 < count) ? 'block' : 'none';

            // Configura os cliques dos botões (sem recarregar a página)
            btnPrev.onclick = () => { paginaAtual--; carregarArtigos(termoBusca); window.scrollTo(0, 0); };
            btnNext.onclick = () => { paginaAtual++; carregarArtigos(termoBusca); window.scrollTo(0, 0); };
        }

        // Se estiver pesquisando OU se NÃO estiver na Página 1 (Renderiza tudo como cartão pequeno)
        if (termoBusca || paginaAtual > 1) {
            
            if (heroSection && termoBusca && paginaAtual === 1) {
                heroSection.innerHTML = `
                    <div style="padding: 2rem 0; border-bottom: 1px dashed var(--border-color); margin-bottom: 2rem;">
                        <span class="hero-tag" style="background-color: var(--border-color); color: var(--text-primary);">RESULTADOS DA BUSCA</span>
                        <h2 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; margin: 10px 0 0 0; color: var(--accent-amber);">"${termoBusca}"</h2>
                    </div>
                `;
            } else if (heroSection) {
                heroSection.innerHTML = ''; // Limpa o hero nas páginas antigas
            }
            
            data.forEach(artigo => desenharCartao(artigo, grid));

        } else {
            const materiaPrincipal = data[0]; 
            
            if (heroSection) {
                // Formata a data para a manchete principal
                const dataHero = new Date(materiaPrincipal.created_at).toLocaleDateString('pt-BR');

                heroSection.innerHTML = `
                    <div style="display: flex; flex-wrap: wrap; gap: 3rem; align-items: center;">
                        
                        <!-- LADO ESQUERDO: A MANCHETE GIGANTE COM CARA DE NOTÍCIA -->
                        <div style="flex: 1 1 60%; min-width: 300px;">
                            
                            <!-- Nova linha com Categoria e Data -->
                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 1.2rem;">
                                <span class="hero-tag" style="background-color: var(--accent-red); margin-bottom: 0;">${materiaPrincipal.categoria}</span>
                                <span style="font-family: 'Courier Prime', monospace; color: var(--text-secondary); font-size: 0.85rem;">Publicado em: ${dataHero}</span>
                            </div>
                            
                            <!-- Título com efeito hover dourado -->
                            <h1 class="hero-title">
                                <a href="artigo.html?id=${materiaPrincipal.id}" style="color: inherit; text-decoration: none; transition: color 0.3s;" onmouseover="this.style.color='var(--accent-amber)'" onmouseout="this.style.color='inherit'">
                                    ${materiaPrincipal.titulo}
                                </a>
                            </h1>
                            <p class="hero-excerpt">${materiaPrincipal.resumo}</p>
                            
                            <!-- Botão de "Leia Mais" para dar cara de matéria clicável -->
                            <a href="artigo.html?id=${materiaPrincipal.id}" style="display: inline-block; margin-top: 15px; font-family: 'Courier Prime', monospace; color: var(--accent-amber); font-size: 0.9rem; text-decoration: none; font-weight: bold; border-bottom: 1px solid var(--accent-amber); padding-bottom: 3px; letter-spacing: 1px; transition: all 0.2s;" onmouseover="this.style.color='#fff'; this.style.borderColor='#fff'" onmouseout="this.style.color='var(--accent-amber)'; this.style.borderColor='var(--accent-amber)'">
                                LER O DOSSIÊ COMPLETO &rarr;
                            </a>
                        </div>

                        <!-- LADO DIREITO: O CANAL DE DENÚNCIAS/HISTÓRIAS -->
                        <div style="flex: 1 1 30%; min-width: 280px; background-color: #111311; border: 1px solid var(--border-color); border-top: 3px solid var(--accent-amber); padding: 2.5rem 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                            <h3 style="font-family: 'Playfair Display', serif; color: var(--accent-amber); font-size: 1.4rem; margin: 0 0 10px 0;">Conte sua História</h3>
                            <p style="font-family: 'Courier Prime', monospace; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.8rem;">
                                Sabe de algo que precisa ser investigado? Tem documentos vazados ou um relato importante? Nós queremos te ouvir. <strong>O sigilo da fonte é absoluto.</strong>
                            </p>
                            
                            <a href="https://wa.me/556899361279?text=Olá,%20tenho%20uma%20sugestão%20de%20pauta%20para%20a%20Redação." target="_blank" style="display: flex; align-items: center; justify-content: center; gap: 10px; background-color: #25D366; color: #fff; text-decoration: none; font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: bold; text-transform: uppercase; padding: 14px; border-radius: 4px; transition: background 0.3s;" onmouseover="this.style.backgroundColor='#1ebd57'" onmouseout="this.style.backgroundColor='#25D366'">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                Falar com a Redação
                            </a>
                        </div>
                    </div>
                `;
            }

            data.forEach(artigo => desenharCartao(artigo, grid));
        }

    } catch (error) {
        console.error("Erro ao carregar os artigos:", error.message);
        const grid = document.querySelector('.articles-grid');
        if (grid) grid.innerHTML = '<p style="color: var(--accent-red); font-family: Courier Prime;">Erro de conexão com a redação.</p>';
    }
}

function desenharCartao(artigo, grid) {
    const dataFormatada = new Date(artigo.created_at).toLocaleDateString('pt-BR');
    
    // Verifica se a matéria tem imagem cadastrada no banco. Se tiver, monta a foto.
    const imagemCapa = artigo.imagem_url 
        ? `<a href="artigo.html?id=${artigo.id}" style="display: block; overflow: hidden;">
             <img src="${artigo.imagem_url}" alt="Capa" style="width: 100%; height: 220px; object-fit: cover; border-bottom: 1px solid var(--border-color); display: block; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
           </a>` 
        : '';

    grid.innerHTML += `
        <article class="article-card" style="padding: 0; display: flex; flex-direction: column;">
            ${imagemCapa}
            <div style="padding: 1.5rem; display: flex; flex-direction: column; flex-grow: 1;">
                <div class="article-meta">
                    <span>${artigo.categoria}</span>
                    <span>${dataFormatada}</span>
                </div>
                <h2 class="article-title"><a href="artigo.html?id=${artigo.id}">${artigo.titulo}</a></h2>
                <p class="article-excerpt">${artigo.resumo}</p>
            </div>
        </article>
    `;
}

async function carregarPatrocinadores() {
    const area = document.getElementById('area-patrocinadores');
    if (!area) return;

    try {
        // Busca todos os patrocinadores do mais novo pro mais antigo
        const { data, error } = await supabaseClient
            .from('patrocinadores')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Se tiver patrocinador cadastrado, desenha os banners
        if (data.length > 0) {
            area.innerHTML = data.map(p => `
                <div class="ad-panel" style="margin-bottom: 2.5rem; padding: 1rem; border-color: var(--accent-amber); box-shadow: 0 5px 15px rgba(0,0,0,0.4); text-align: center;">
                    <span style="font-family: 'Courier Prime', monospace; font-size: 0.65rem; color: var(--text-secondary); letter-spacing: 2px; display: block; margin-bottom: 8px;">PUBLICIDADE</span>
                    <a href="${p.link_destino}" target="_blank" rel="noopener noreferrer">
                        <img src="${p.imagem_url}" alt="${p.nome}" style="width: 100%; border-radius: 4px; border: 1px solid #000; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                    </a>
                </div>
            `).join('');
        } else {
             // Se o banco estiver vazio, mostra a caixa padrão oferecendo o espaço
             area.innerHTML = `
                <div class="ad-panel" style="margin-top: 1.5rem; padding: 1.5rem;">
                    <h3 class="ad-title" style="color: var(--text-secondary); font-size: 1rem;">Patrocínio Regional</h3>
                    <div style="width: 100%; height: 250px; background-color: #171a17; border: 1px dashed var(--border-color); display: flex; align-items: center; justify-content: center; font-family: 'Courier Prime'; font-size: 0.7rem; color: #555; text-align: center;">
                        Espaço para Banner<br>(300x250)<br><br>Anuncie Aqui
                    </div>
                </div>
             `;
        }
    } catch (error) {
        console.error("Erro ao carregar patrocinadores:", error.message);
    }
}

// Executa as funções assim que a página terminar de carregar
document.addEventListener('DOMContentLoaded', () => {
    carregarTicker();
    carregarArtigos();
    carregarPerfilEditor();
    carregarPatrocinadores();

    const formPesquisa = document.getElementById('form-pesquisa');
    if (formPesquisa) {
        formPesquisa.addEventListener('submit', (e) => {
            e.preventDefault(); // Evita que a página recarregue
            const termoDigitado = document.getElementById('input-pesquisa').value;
            // Roda a função de novo, mas agora passando a palavra que o usuário digitou!
            carregarArtigos(termoDigitado);
        });
    }
});

async function carregarPerfilEditor() {
    const area = document.getElementById('area-perfil-editor');
    if (!area) return;

    try {
        const { data, error } = await supabaseClient
            .from('perfil_editor')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) throw error;

        if (data && data.nome) {
            let htmlCartao = `
                <div style="background-color: #1e221e; border: 1px solid var(--border-color); box-shadow: inset 0 0 20px rgba(0,0,0,0.3); padding: 2rem 1.5rem; text-align: left; border-top: 2px solid var(--accent-amber);">
            `;

            if (data.imagem_url) {
                htmlCartao += `
                    <img src="${data.imagem_url}" alt="Foto de ${data.nome}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-amber); margin-bottom: 15px; display: block;">
                `;
            }

            // Nome e biografia
            htmlCartao += `
                    <h3 style="font-family: 'Playfair Display', serif; color: var(--text-primary); font-size: 1.3rem; margin: 0 0 10px 0;">${data.nome}</h3>
                    <p style="font-family: 'Courier Prime', monospace; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1.5rem;">
                        ${data.biografia}
                    </p>
            `;

            // Se o cara colocou link, desenha o botão de "Acompanhe"
            if (data.link_redes) {
                htmlCartao += `
                    <a href="${data.link_redes}" target="_blank" style="display: flex; align-items: center; gap: 10px; color: var(--accent-amber); text-decoration: none; font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; transition: color 0.2s;" onmouseover="this.style.color='#e3be6d'" onmouseout="this.style.color='var(--accent-amber)'">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        Acompanhe no Facebook
                    </a>
                `;
            }

            htmlCartao += `</div>`;
            area.innerHTML = htmlCartao;
        }
    } catch (error) {
        console.error("Erro ao carregar o perfil do editor:", error.message);
    }
}