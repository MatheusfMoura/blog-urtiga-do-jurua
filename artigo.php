<?php
// 1. O servidor apanha o ID da matéria no link
$id_materia = isset($_GET['id']) ? $_GET['id'] : null;

// 2. Informações padrão (O título é fixo como você pediu)
$titulo_og = "Rapidinhas com Urtiga do Juruá";
$descricao_og = "Jornalismo Investigativo direto de Cruzeiro do Sul.";
$imagem_og = "https://urtigadojurua.com/capa-padrao.jpg"; // Altere depois para uma logo padrão sua
$url_og = "https://urtigadojurua.com";

if ($id_materia) {
    // 3. O servidor vai buscar a foto correta ao Supabase num milissegundo
    $supabase_url = "https://uzplnvrjumguswkljoof.supabase.co/rest/v1/artigos?id=eq." . $id_materia . "&select=resumo,imagem_url,imagem_descricao";
    $supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6cGxudnJqdW1ndXN3a2xqb29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MjUzNzEsImV4cCI6MjA5MzUwMTM3MX0.CenoxOdBtraYevH8cQFdlsc-yuA2CG_MKGGDDYQwu_A";

    $ch = curl_init($supabase_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        "apikey: " . $supabase_key,
        "Authorization: Bearer " . $supabase_key
    ));
    $resposta = curl_exec($ch);
    curl_close($ch);

    if ($resposta) {
        $dados = json_decode($resposta, true);
        if (!empty($dados) && isset($dados[0])) {
            // Se encontrar a foto da matéria, atualiza a variável da imagem
            if (!empty($dados[0]['imagem_url'])) {
                $imagem_og = $dados[0]['imagem_url'];
            }
            if (!empty($dados[0]['resumo'])) {
                $descricao_og = $dados[0]['resumo'];
            }
        }
    }
    $url_og = "https://urtigadojurua.com/artigo.php?id=" . $id_materia;
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <title>Rapidinhas com Urtiga do Juruá</title>
    
    <meta property="og:title" content="<?php echo $titulo_og; ?>">
    <meta property="og:description" content="<?php echo $descricao_og; ?>">
    <meta property="og:image" content="<?php echo $imagem_og; ?>">
    <meta property="og:url" content="<?php echo $url_og; ?>">
    <meta property="og:type" content="article">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo $titulo_og; ?>">
    <meta name="twitter:description" content="<?php echo $descricao_og; ?>">
    <meta name="twitter:image" content="<?php echo $imagem_og; ?>">

    <link rel="stylesheet" href="css/style.css">

    <script async src="https://www.googletagmanager.com/gtag/js?id=G-NSMBEFKMNV"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-NSMBEFKMNV');
    </script>

    <style>
        .leitura-container {
            background-color: var(--bg-paper);
            border: 1px solid var(--border-color);
            padding: 3rem;
            box-shadow: 10px 10px 0px rgba(207, 168, 88, 0.1);
        }
        .leitura-header {
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 2rem;
            margin-bottom: 2rem;
            text-align: center;
        }
        #materia-categoria {
            font-family: 'Courier Prime', monospace;
            color: var(--accent-red);
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: bold;
            display: block;
            margin-bottom: 1rem;
        }
        #materia-titulo {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            color: var(--text-primary);
            line-height: 1.1;
            margin: 0 0 1.5rem 0;
        }
        .leitura-meta {
            font-family: 'Courier Prime', monospace;
            font-size: 0.8rem;
            color: var(--text-secondary);
        }
        #materia-conteudo {
            font-size: 1.15rem;
            line-height: 1.8;
            color: #d1cfc0;
            white-space: pre-wrap;
        }
        .btn-voltar {
            display: inline-block;
            margin-top: 3rem;
            color: var(--accent-amber);
            text-decoration: none;
            font-family: 'Courier Prime', monospace;
            border: 1px solid var(--accent-amber);
            padding: 10px 20px;
            transition: all 0.3s;
        }
        .btn-voltar:hover {
            background-color: var(--accent-amber);
            color: var(--bg-main);
        }
        @media (max-width: 768px) {
            .leitura-container { padding: 1.5rem; }
            #materia-titulo { font-size: 2rem; }
        }
    </style>
</head>
<body>

    <header>
        <div class="header-content">
            <a href="index.html" class="logo">
                <span class="logo-icon">𐃆</span>
                Urtiga do Juruá
            </a>
        </div>
    </header>

    <div class="container">
        
        <main class="leitura-container">
            <div class="leitura-header">
                <span id="materia-categoria">Carregando...</span>
                <h1 id="materia-titulo">Acessando os arquivos da redação...</h1>
                <div class="leitura-meta">
                    Publicado em: <span id="materia-data">--</span>
                </div>
            </div>

            <div id="container-capa" style="display: none; margin-bottom: 2rem;">
                <img id="materia-imagem" src="" alt="Capa da investigação" style="width: 100%; max-height: 450px; object-fit: cover; border-bottom: 3px solid var(--accent-amber);">
                <p id="materia-imagem-legenda" style="font-family: 'Courier Prime', monospace; font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px; font-style: italic; border-left: 2px solid var(--accent-amber); padding-left: 10px;"></p>
            </div>

            <div id="materia-conteudo">
                Aguarde um instante enquanto descriptografamos os dados do servidor.
            </div>

            <a href="index.html" class="btn-voltar">← Voltar para o inicio</a>
        </main>

        <aside class="sidebar">
            <h2 class="section-title">Apoie a Verdade</h2>
            <div id="area-patrocinadores"></div>
        </aside>

    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/config.js"></script>
    <script src="js/artigo.js"></script>

</body>
</html>