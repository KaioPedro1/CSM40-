const listar_produto_URL = "http://loja.buiar.com/?key=35xkr4&f=json&c=produto&t=listar"
const listar_categoria_URL= "http://loja.buiar.com/?key=35xkr4&f=json&c=categoria&t=listar"
const produtosDivID = document.getElementById('produtos');
const corBadgeVermelha = "position-absolute translate-middle badge rounded-pill text-bg-danger"
const corBadgeVerde = "position-absolute translate-middle badge rounded-pill text-bg-success"
const carrinhoProdutos = document.getElementById('carrinhoProdutos');
var btn = document.getElementById("buscaPedido");
var requestUrl;
var id;

/* variaveis globais */
var lista_produtos
var lista_categorias
var categoria_hash_map = new Map()
var carrinho;

/* treinando async, await, fetch e promise, aqui é a mesma ideia que utilizar o XMLhttpRequest*/
async function getData(){
    //instancia um objeto do tipo Carrinho
    carrinho = new Carrinho();
    //preenche lista de produtos
    let responseProduto = await fetch(listar_produto_URL);
    lista_produtos = await responseProduto.json();
    //preenche lista de categorias
    let responseCategoria = await fetch(listar_categoria_URL);
    lista_categorias = await responseCategoria.json();

    for(let k=0; k<lista_categorias.dados.length;k++){
        categoria_hash_map.set(lista_categorias.dados[k].id, lista_categorias.dados[k].nome)
        }
};
/*NÃO ESTOU CHAMANDO EVENTO NENHUM POR HTML, O INICIO DO SCRIPT COMECA NESTE EVENTO */
document.addEventListener("DOMContentLoaded", async () =>{
        await getData();
        tratamentoProdutos();
        //cria um elemento HTML para cada item da lista de produto
        for(let k=0; k<lista_produtos.dados.length;k++){
            criaCatalogoHTML(lista_produtos.dados[k])
        }
        criaFiltrosHTML();
})

function tratamentoProdutos(){
    var formato = { minimumFractionDigits: 2 , style: 'currency', currency: 'BRL', maximumFractionDigits: 3 }
    /*transforma o id da categoria para nome e converte em BRL o preco*/
    for(let k=0; k<lista_produtos.dados.length;k++){
        lista_produtos.dados[k].categoria = categoria_hash_map.get(lista_produtos.dados[k].categoria)
        lista_produtos.dados[k].preco = parseInt(lista_produtos.dados[k].preco).toLocaleString('pt-br', formato)
    }
}
//2 funcões para criar os elementos html do produto e a lista no offcanvas do carrinho, são chamadas depois do carregamento dos elementos html
function criaCatalogoHTML(dadosProdutos){
    let newSection = document.createElement('section');
    newSection.classList.add("produto");
    newSection.classList.add("row");
    newSection.classList.add("g-0");
    newSection.id=dadosProdutos.id;
    newSection.setAttribute('draggable', true);
    newSection.setAttribute('ondragstart', 'drag(event)');
    newSection.style.setProperty('margin-bottom', '0.5%');
    newSection.addEventListener('dblclick',()=>{carrinho.addProduto(dadosProdutos.id)})
    newSection.innerHTML= `
            <div class="col-md-3">
                <img id = "img_${dadosProdutos.id}"src="imagens/veiculos/undefined.png" class="figure img-fluid rounded-start" draggable="false">
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
                    <button href="#" class="btn btn-primary btn-lg" onclick="carrinho.addProduto(${dadosProdutos.id})">Adicionar ao carrinho</button>
                    <button href="contato.html" class="btn btn-secondary btn-lg">Entre em contato</button>
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
function criaCarrinhoOffcanvasHTML(produto){
    let newRow = document.createElement('div');
    newRow.classList.add("row");
    newRow.id = "produtoCarrinho_"+produto.id

    newRow.innerHTML =  `<div class="accordion col-9">
                <div class="accordion-item">
                    <h2 class="accordion-header" id="heading_${produto.id}">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_${produto.id}"
                         aria-expanded="false"  aria-controls="collapse_${produto.id}">
                         <strong>${produto.nome}</strong> <span class="badge bg-primary rounded-pill" id= "valor_carrinho_unitario_${produto.id}">${produto.preco}</span>
                    </button>
                    </h2>
                    <div id="collapse_${produto.id}" class="accordion-collapse collapse" aria-labelledby="heading_${produto.id}"
                    data-bs-parent="#accordion_${produto.id}">
                    <div class="accordion-body">
                    ${produto.descricao}
                    </div>
                    </div>
                </div>
                </div>
                <div class="teste col-3"><button class="w-50" onclick="carrinho.addProduto(${produto.id})">+</button><button onclick="carrinho.removeProduto(${produto.id})" class="w-50">-</button><span><input type="text" name="quant[1]" class="form-control input-number" id = "carrinhoCont_${produto.id}"value="${produto.quantidade}" min="1" max="10" disabled style="text-align: center;"></span></div>
            </div>`;
    carrinhoProdutos.appendChild(newRow);
}
//3 funçoes para o drag and drop
function drag(event){
    event.dataTransfer.setData('text', event.target.id);
}
function allowdrop(event){
    event.preventDefault();
}
function drop(event){
    event.preventDefault();
    var data = event.dataTransfer.getData('text');
    carrinho.addProduto(data);
}
//4 funções para os filtros
function criaFiltrosHTML(){
    const filtroCategorias =  document.getElementById('filtro_categorias');
    const filtroMarcas = document.getElementById('filtro_marcas');
    
    for(let k=0; k<lista_categorias.dados.length;k++){
        let newLabel = document.createElement('label');
        newLabel.classList.add("list-group-item");
        newLabel.innerHTML =  `<input class="form-check-input me-1" type="checkbox"onclick="atualizaCatalogoPorFiltroSelecionado()" value="${lista_categorias.dados[k].nome}">
        ${lista_categorias.dados[k].nome}`;
   
        filtroCategorias.appendChild(newLabel);
    }
    //como nao existe uma coluna no banco de dados para marcas, então tem que pegar primeiro aqui
    let marcas = []
    for(let k=0; k<lista_produtos.dados.length;k++)
    {   
        t=lista_produtos.dados[k].descricao.split(',')[0]
        //verifica se existe no array
        if(marcas.indexOf(t)==-1){
            marcas.push(t);
        }
    }
    for(let k=0; k<marcas.length; k++){
        let newLabel = document.createElement('label');
        newLabel.classList.add("list-group-item");  
        newLabel.innerHTML =  `<input class="form-check-input me-1" type="checkbox"  onclick="atualizaCatalogoPorFiltroSelecionado()"value="${marcas[k]}">
        ${marcas[k]}`;
        filtroMarcas.appendChild(newLabel);
    } 
}
function atualizaCatalogoPorFiltroSelecionado(){
    const filtroCategorias =  document.getElementById('filtro_categorias');
    const filtroMarcas = document.getElementById('filtro_marcas');
    var arrayCategoriaChecked = verificaFiltroChecked('filtro_categorias');
    var arrayMarcasChecked = verificaFiltroChecked('filtro_marcas');
    let flag_nenhum_filtro=false;
   
    while(produtosDivID.firstChild)
    {
    produtosDivID.removeChild(produtosDivID.lastChild);
    }

    if(arrayMarcasChecked.length==0){
        while (filtroMarcas.firstChild) 
        {
        filtroMarcas.removeChild(filtroMarcas.lastChild);
        }
    }
    if(arrayCategoriaChecked.length==0){
        while(filtroCategorias.firstChild)
        {
            filtroCategorias.removeChild(filtroCategorias.lastChild);
        }
    }


    for(let j=0; j<lista_produtos.dados.length;j++){
        if(arrayCategoriaChecked.length==0 && arrayMarcasChecked.length==0)
        {   
            flag_nenhum_filtro=true;
            criaCatalogoHTML(lista_produtos.dados[j])
        }
        else if (arrayCategoriaChecked.length==0 || arrayMarcasChecked.length==0){
            for (let k =0 ;k<arrayCategoriaChecked.length; k++){
                if(lista_produtos.dados[j].categoria==arrayCategoriaChecked[k]){
                    criaCatalogoHTML(lista_produtos.dados[j])
                    if(!verificaFiltroMarcaExiste(lista_produtos.dados[j].descricao.split(',')[0], 'filtro_marcas'))
                    {
                        let newLabel = document.createElement('label');
                        newLabel.classList.add("list-group-item");  
                        newLabel.innerHTML =  `<input class="form-check-input me-1" type="checkbox" onclick="atualizaCatalogoPorFiltroSelecionado()" value="${lista_produtos.dados[j].descricao.split(',')[0]}">
                        ${lista_produtos.dados[j].descricao.split(',')[0]}`;
                        filtroMarcas.appendChild(newLabel);
                    }
                }
            }
            for (let k =0 ;k<arrayMarcasChecked.length; k++){
                if(lista_produtos.dados[j].descricao.split(',')[0]==arrayMarcasChecked[k]){
                    criaCatalogoHTML(lista_produtos.dados[j]);
                    if(!verificaFiltroMarcaExiste(lista_produtos.dados[j].categoria, 'filtro_categorias'))
                    {
                        let newLabel = document.createElement('label');
                        newLabel.classList.add("list-group-item");  
                        newLabel.innerHTML =  `<input class="form-check-input me-1" type="checkbox" onclick="atualizaCatalogoPorFiltroSelecionado()" value="${lista_produtos.dados[j].categoria}">
                        ${lista_produtos.dados[j].categoria}`;
                        filtroCategorias.appendChild(newLabel);
                    }
                }
            }
        }
        else{
            for(let i = 0; i<arrayMarcasChecked.length; i++){
                for(let k = 0; k<arrayCategoriaChecked.length; k++)
                {
                    if(lista_produtos.dados[j].categoria==arrayCategoriaChecked[k] && lista_produtos.dados[j].descricao.split(',')[0]==arrayMarcasChecked[i]){
                    criaCatalogoHTML(lista_produtos.dados[j]);
                    }
                }
            }
        }
        
    }
    if(flag_nenhum_filtro){
        criaFiltrosHTML();
    }
}
function verificaFiltroChecked(filtro){
    const filtroHTML = document.getElementById(filtro);
    var arr = []
    for(let k=0; k<filtroHTML.children.length; k++)
    {
        if(filtroHTML.children[k].children[0].checked)
        {
           arr.push(filtroHTML.children[k].children[0].value);
        }
    }
    return arr;
}
function verificaFiltroMarcaExiste(cat){
    const filtroMarcas = document.getElementById('filtro_marcas');
    for (let index = 0; index < filtroMarcas.children.length; index++) {
        if(filtroMarcas.children[index].children[0].value==cat){
            return true;
        }
    }
    return false;
}

//duas classes principais
class Carrinho{
    constructor(){
        
        this.HTMLimgCarrinho=document.getElementById('imagemCarrinho');
        this.HTMLcarrinhoQTD= document.getElementById('carrinhoContador');
        this.HTMLcarrinhoSubtotal = document.getElementById('carrinho_subtotal');
        //array de produtoCarrinho
        this.produto = [];
        this.is_empty = true;
    } 
    getCarrinhoQuantidade(){
        let contador = 0;
        for(let k=0; k<this.produto.length;k++){
            if(this.produto.lenght == 0){
                return contador;
            }
            contador+=this.produto[k].quantidade;
        }
        return contador;
    }
    verificaProdutoExisteCarrinho(id){
        for(let k=0; k<this.produto.length;k++){
            if(this.produto[k].id == id){
                return true;
            }
        }
        return false;
    }
    addProduto(id){
        this.is_empty= false;
        //condicional para verificar se o produto já existe no carrinho, se já existir só atualiza a quantidade, caso nao exista cria um novo objeto e adiciona na lista
        if(this.verificaProdutoExisteCarrinho(id))
        {
            //esse loop é só para pegar o index do produto e atualizar a quantidade do objeto, da pra melhorar isso aqui, talvez retornando o index na funcão acima
            for(let k=0; k<this.produto.length;k++)
            {
                if(this.produto[k].id == id)
                {
                this.produto[k].atualizaQuantidade('+');
                //fiquei com preguiça de criar uma funcao para atualizar esses valores 
                document.getElementById('valor_carrinho_unitario_'+this.produto[k].id).innerText = this.produto[k].getPrecoTotal().toLocaleString('pt-br', {style:'currency', currency:'BRL'});
                document.getElementById('carrinhoCont_'+this.produto[k].id).value = this.produto[k].quantidade;
                }
            }
        }
        else 
        {//loop para achar o item na lista global
            for(let k=0; k<lista_produtos.dados.length;k++)
            {
                if(lista_produtos.dados[k].id == id)
                {
                    //instancia um objeto da classe ProdutoCarrinho usando o outro objeto da lista global
                    let prod = Object.assign(new ProdutoCarrinho(), lista_produtos.dados[k]);
                    this.produto.push(prod);
                    //adiciona um elemento HTML no offcanvas
                    criaCarrinhoOffcanvasHTML(prod)
                }
            }  
        }
        this.HTMLcarrinhoSubtotal.innerText=this.getSubtotalCarrinho().toLocaleString('pt-br', { style: 'currency', currency: 'BRL'});
        this.atualizaIconeCarrinho();
    }
    atualizaIconeCarrinho(){
        if(this.is_empty){
            this.HTMLimgCarrinho.src="imagens/cart.svg"
            this.HTMLcarrinhoQTD.className = corBadgeVermelha;
            this.HTMLcarrinhoQTD.innerText = this.getCarrinhoQuantidade(); 
        }else{
            this.HTMLimgCarrinho.src="imagens/cart-fill.svg"
            this.HTMLcarrinhoQTD.className = corBadgeVerde;
            this.HTMLcarrinhoQTD.innerText = this.getCarrinhoQuantidade(); 
        }
    }
    removeProduto(id){
        for(let k=0; k<this.produto.length;k++)
            {
                if(this.produto[k].id == id)
                {
                this.produto[k].atualizaQuantidade('-');
                //fiquei com preguiça de criar uma funcao para atualizar esses valores 
                document.getElementById('carrinhoCont_'+this.produto[k].id).value = this.produto[k].quantidade;
                document.getElementById('valor_carrinho_unitario_'+this.produto[k].id).innerText = this.produto[k].getPrecoTotal().toLocaleString('pt-br', {style:'currency', currency:'BRL'});
                    if(this.produto[k].quantidade == 0){
                        document.getElementById('produtoCarrinho_'+this.produto[k].id).remove();
                        this.produto.splice(k, 1);
                    }
                }
            }
        if(this.getCarrinhoQuantidade()==0){
            this.is_empty=true;
        }
        this.HTMLcarrinhoSubtotal.innerText=this.getSubtotalCarrinho().toLocaleString('pt-br', { style: 'currency', currency: 'BRL'})
        this.atualizaIconeCarrinho();
    }
    getSubtotalCarrinho(){
        let total = 0
        for (let k=0; k<this.produto.length;k++){
            let preco = this.produto[k].preco.split('R$')[1].split('.').join('').split(',').join('.');
            total += this.produto[k].quantidade*parseFloat(preco);  
        }
        return (total)
    }
    limparCarrinho(){
        this.produto =[]
        this.is_empty = true;
        this.atualizaIconeCarrinho() 
        while (carrinhoProdutos.firstChild) {
            carrinhoProdutos.removeChild(carrinhoProdutos.lastChild);
          }
        this.HTMLcarrinhoSubtotal.innerText=this.getSubtotalCarrinho().toLocaleString('pt-br', { style: 'currency', currency: 'BRL'});
    }
}

class ProdutoCarrinho{
    constructor(){
        this.quantidade=1;
        this.id;
        this.codigo;
        this.categoria;
        this.nome;
        this.descricao;
        this.preco;
        this.imagem;
        this.peso;
    }
    atualizaQuantidade(operador)
    {
        if(operador=="-" && this.quantidade>=1){
            this.quantidade--;
        }
        else if(operador == "+"){
            this.quantidade++;       
        }
        else{
            console.log("ERRO: QUANTIDADE NÃO PODE SER MENOR QUE 0");
        }
    }
    getPrecoTotal(){

        let preco = this.preco.split('R$')[1].split('.').join('').split(',').join('.');
        return (this.quantidade*preco);
    }
} 

/*Busca CEP*/
function buscarCep() {
	let url = 'https://viacep.com.br/ws/' + cep.value + '/json';
    console.log("acessando " + url);
    let request = new XMLHttpRequest();
    request.open('GET', url);
    request.responseType = 'json';
    request.send();
    request.onload = function() {
        //dadosCliente.push(request.response);
        dados = request.response;
        rua.value = dados.logradouro;
        bairro.value = dados.bairro;
        cidade.value = dados.localidade;
        uf.value = dados.uf;
    };
}

var infoCliente;

/* Coloca informações do input do formulario em dadosCliente */
function armazenaDadosForms(){
    var dadosCliente = [];
    nomeInput = document.getElementById("nome").value
    cpfInput = document.getElementById("cpf").value
    cepInput = document.getElementById("cep").value
    ruaInput = document.getElementById("rua").value
    bairroInput = document.getElementById("bairro").value
    cidadeInput = document.getElementById("cidade").value
    ufInput = document.getElementById("uf").value
    numInput = document.getElementById("numero").value
    complInput = document.getElementById("complemento").value
    dadosCliente.push({nome: nomeInput, cpf: cpfInput, cep: cepInput, rua: ruaInput, bairro: bairroInput, cidade: cidadeInput, uf: ufInput, numero: numInput, complemento: complInput});
    infoCliente = dadosCliente;
    resumoDadosEPedidos(dadosCliente);
}

/* Envia a requisicao para o backend */
function enviaRequisicao(){   
    const RequisicaoURL = "http://loja.buiar.com/?key=35xkr4&c=pedido&t=inserir&f=json&nome=" + infoCliente[0].nome + "&cpf=" + infoCliente[0].cpf + "&cep=" + infoCliente[0].cep 
    + "&rua=" + encodeURI(infoCliente[0].rua) + "&bairro=" + encodeURI(infoCliente[0].bairro) + "&uf=" + infoCliente[0].uf + "&cidade=" + encodeURI(infoCliente[0].cidade) 
    + "&numero=" + infoCliente[0].numero + "&complemento=" +infoCliente[0].complemento;
    console.log(RequisicaoURL);
    let request = new XMLHttpRequest();
    request.open('POST', RequisicaoURL);
    request.responseType = 'json';
    request.send();
    request.onload = function() {
        let data = request.response;
        console.log(data);
        idPedido = data.dados.id;
        nChamadasDeInsercao(idPedido);
    };
}

/* Mostra resumo dados do cliente e pedido */
function resumoDadosEPedidos(dadosCliente){
    var tag0 = document.createElement("h3");
    var text0 = document.createTextNode("Compra");
    tag0.appendChild(text0);

    var telaResumo = document.getElementById("resumoDadosCliente");

    telaResumo.appendChild(tag0);

    for (var i = 1; i <= carrinho.produto.length; i++){
        /* Todas infos do pedido */
        var tag1 = document.createElement("p");
        var text1 = document.createTextNode("Produto (" + i + "): " + carrinho.produto[i-1].nome);
        tag1.appendChild(text1);

        var tag2 = document.createElement("p");
        var text2 = document.createTextNode("Descrição: " +  carrinho.produto[i-1].descricao);
        tag2.appendChild(text2);

        var tag3 = document.createElement("p");
        var text3 = document.createTextNode("Preço: " + carrinho.produto[i-1].preco);
        tag3.appendChild(text3);

        var tag4 = document.createElement("p");
        var text4 = document.createTextNode("Quantidade: " + carrinho.produto[i-1].quantidade);
        tag4.appendChild(text4);

        telaResumo.appendChild(tag1);
        telaResumo.appendChild(tag2);
        telaResumo.appendChild(tag3);
        telaResumo.appendChild(tag4);
    }

    var tag1 = document.createElement("h3");
    var text1 = document.createTextNode("Seus dados");
    tag1.appendChild(text1);

    /* Todas infos do cliente */
    var tag5 = document.createElement("p");
    var text5 = document.createTextNode("Nome: " + dadosCliente[0].nome);
    tag5.appendChild(text5);
    

    var tag6 = document.createElement("p");
    var text6 = document.createTextNode("CPF: " + dadosCliente[0].cpf);
    tag6.appendChild(text6);


    var tag7 = document.createElement("p");
    var text7 = document.createTextNode("CEP: " + dadosCliente[0].cep);
    tag7.appendChild(text7);

    var tag8 = document.createElement("p");
    var text8 = document.createTextNode("Endereço: " + dadosCliente[0].rua + ", " + dadosCliente[0].bairro + " - " + dadosCliente[0].cidade + ", " + dadosCliente[0].uf);
    tag8.appendChild(text8);
    
    var tag9 = document.createElement("p");
    var text9 = document.createTextNode("Complemento: " + dadosCliente[0].numero + ", " + dadosCliente[0].complemento);
    tag9.appendChild(text9);

    document.getElementById('infoTotal').innerText = carrinho.getSubtotalCarrinho().toLocaleString('pt-br', { style: 'currency', currency: 'BRL'});

    telaResumo.appendChild(tag1);
    telaResumo.appendChild(tag5);
    telaResumo.appendChild(tag6);
    telaResumo.appendChild(tag7);
    telaResumo.appendChild(tag8);
    telaResumo.appendChild(tag9);
}

/* Limpa a tela de resumo dos dados e pedidos removendo as tags criadas anteriormente  */
function limpaTelaResumo(){
    /* 5 <p> dos dados do cliente */
    for (var i = 0; i < 5; i++){
        const elemento = document.querySelector("p:last-child");
        elemento.parentElement.removeChild(elemento);
    }

    const elemento = document.querySelector("h3:last-child");
    elemento.parentElement.removeChild(elemento);

    /* 4 <p> dos dados da compra */
    for (var i = 0; i < carrinho.produto.length; i++){
        for (var j = 0; j < 4; j++){
            const elemento = document.querySelector("p:last-child");
            elemento.parentElement.removeChild(elemento);
        }
    }

    const elemento1 = document.querySelector("h3");
    elemento1.parentElement.removeChild(elemento1);

    enviaRequisicao();
}

function nChamadasDeInsercao(idPedido){
    console.log(carrinho.produto);
    for (var i = 0; i < carrinho.produto.length; i++){
        insereItensPedido(i, idPedido);
    }
    telaFinalPedido(idPedido);
}

/* Insere itens no pedido */
function insereItensPedido(i, idPedido){
    console.log(idPedido);
    const insereItensURL = "http://loja.buiar.com/?key=35xkr4&c=item&t=inserir&f=json&pedido="+ idPedido +"&produto=" + carrinho.produto[i].id + "&qtd=" + carrinho.produto[i].quantidade;
    console.log(insereItensURL)
    let request = new XMLHttpRequest();
    request.open('POST', insereItensURL);
    request.responseType = 'json';
    request.send();
}

/* Tela final com a informação do id do pedido */
function telaFinalPedido(idPedido){
    carrinho.limparCarrinho();
    console.log(1);
    const numero = document.createTextNode(" " + idPedido);
    const tag = document.getElementById('infoNumPedido');
    tag.appendChild(numero);

    var urlBoleto = "http://loja.buiar.com/?key=35xkr4&c=boleto&t=listar&id=" + idPedido;

    const boleto = document.createTextNode(" " + urlBoleto);
    const tag1 = document.getElementById('infoBoleto');
    tag1.appendChild(boleto);
    console.log(2);
}