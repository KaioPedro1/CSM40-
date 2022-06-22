const listar_produto_URL = "http://loja.buiar.com/?key=35xkr4&f=json&c=produto&t=listar"
const listar_categoria_URL= "http://loja.buiar.com/?key=35xkr4&f=json&c=categoria&t=listar"
const produtosDivID = document.getElementById('produtos');
const corBadgeVermelha = "position-absolute translate-middle badge rounded-pill text-bg-danger"
const corBadgeVerde = "position-absolute translate-middle badge rounded-pill text-bg-success"

/* variaveis globais*/
var lista_produtos
var lista_categorias
var categoria_hash_map = new Map()

/* treinando async, await, fetch e promise, aqui é a mesma coisa que utilizar o XMLhttpRequest*/
async function getData(){
    let responseProduto = await fetch(listar_produto_URL);
    lista_produtos = await responseProduto.json();

    let responseCategoria = await fetch(listar_categoria_URL);
    lista_categorias = await responseCategoria.json();

        for(let k=0; k<lista_categorias.dados.length;k++){
            categoria_hash_map.set(lista_categorias.dados[k].id, lista_categorias.dados[k].nome)
            }
};
/*NÃO ESTOU CHAMANDO EVENTO NENHUM POR HTML, O INICIO DO SCRIPT COMECA NESSE EVENTO */
document.addEventListener("DOMContentLoaded", async () =>{
        await getData();
        tratamentoProdutos();
        for(let k=0; k<lista_produtos.dados.length;k++){
            criaElementosHTML(lista_produtos.dados[k])
        }

})

function tratamentoProdutos(){
    var formato = { minimumFractionDigits: 2 , style: 'currency', currency: 'BRL', maximumFractionDigits: 3 }
    /*transforma o id da categoria para nome e converte em BRL o preco*/
    for(let k=0; k<lista_produtos.dados.length;k++){
        lista_produtos.dados[k].categoria = categoria_hash_map.get(lista_produtos.dados[k].categoria)
        lista_produtos.dados[k].preco = parseInt(lista_produtos.dados[k].preco).toLocaleString('pt-br', formato)
    }
}

function criaElementosHTML(dadosProdutos){
    let newSection = document.createElement('section');
    newSection.classList.add("produto");
    newSection.classList.add("row");
    newSection.classList.add("g-0");
    newSection.id=dadosProdutos.id;
    newSection.addEventListener('dblclick',()=>{adicionarCarrinho(dadosProdutos.id)})
    newSection.innerHTML= `
            <div class="col-md-3">
                <img id = "img_${dadosProdutos.id}"src="https://www.webmotors.com.br/imagens/prod/348146/CHEVROLET_ONIX_1.0_FLEX_MANUAL_34814611043340082.png?s=fill&w=440&h=330&q=80&t=true" class="figure img-fluid rounded-start">
            </div>
            <div class="col-md-6">
                    <div class="card-body">
                        <h1 class="card-title">${dadosProdutos.nome}</h1>
                        <h2 class ="card-subtitle mb-2 text-muted">${dadosProdutos.categoria}</h2>
                        <ul id="lista_${dadosProdutos.id}"class="list-group list-group-flush">
                        </ul>
                    </div>
            </div>
            <div class="col-md-3 card text-center">
                <div class="card-body">
                    <h1 class="card-text">${dadosProdutos.preco}</h1>
                    <a href="#" class="btn btn-primary btn-lg" onclick="adicionarCarrinho(${dadosProdutos.id})">Adicionar ao carrinho</a>
                    <a href="contato.html" class="btn btn-secondary btn-lg">Entre em contato</a>
                </div>
            </div>
    `;
/* preenche a lista de descrição*/
    produtosDivID.appendChild(newSection)
    let descricao = dadosProdutos.descricao.split(",");
    for(let k=0; k<descricao.length; k++){
        let li = document.createElement('li');
        li.innerText=descricao[k];
        li.classList.add("list-group-item");
        document.getElementById('lista_'+dadosProdutos.id).appendChild(li)
    }
/*trata imagem */
    if(dadosProdutos.imagem!=""){
        if(dadosProdutos.imagem=="imagens/veiculos/undefined"){
            dadosProdutos.imagem +=".png"
        }
        document.getElementById('img_'+dadosProdutos.id).src=dadosProdutos.imagem;
    }
}

function adicionarCarrinho(id){
    imgCarrinho=document.getElementById('imagemCarrinho');
    carrinhoQTD= document.getElementById('carrinhoContador');
    if(carrinhoQTD.innerText==0){
        imgCarrinho.src="imagens/cart-fill.svg"
        carrinhoQTD.className = corBadgeVerde;
    }
    carrinhoQTD.innerText++;   
}
