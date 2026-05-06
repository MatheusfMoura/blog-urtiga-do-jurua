document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailValor = document.getElementById('email').value;
    const senhaValor = document.getElementById('senha').value;
    const msgErro = document.getElementById('mensagem-erro');
    const btnSubmit = document.querySelector('.btn-apoio');

    btnSubmit.innerText = "Autenticando...";
    msgErro.style.display = 'none'; // Esconde o erro se estiver aparecendo

    // Tenta fazer o login no Supabase
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: emailValor,
        password: senhaValor,
    });

    if (error) {
        // Se a senha estiver errada
        msgErro.style.display = 'block';
        btnSubmit.innerText = "Entrar no Sistema";
    } else {
        // Se deu certo, joga o cliente lá pra tela de publicação!
        window.location.replace('admin.html');
    }
});