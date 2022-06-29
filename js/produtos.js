const listar_produto_URL = "http://loja.buiar.com/?key=35xkr4&f=json&c=produto&t=listar"
const listar_categoria_URL= "http://loja.buiar.com/?key=35xkr4&f=json&c=categoria&t=listar"
const produtosDivID = document.getElementById('produtos');
const corBadgeVermelha = "position-absolute translate-middle badge rounded-pill text-bg-danger"
const corBadgeVerde = "position-absolute translate-middle badge rounded-pill text-bg-success"
const carrinhoProdutos = document.getElementById('carrinhoProdutos');
var btn = document.getElementById("buscaPedido");
var requestUrl;
var id;

/* variaveis globais*/
var lista_produtos
var lista_categorias
var categoria_hash_map = new Map()
var carrinho;
var dadosCliente = [];
var idPedido;

/* treinando async, await, fetch e promise, aqui é a mesa ideia que utilizar o XMLhttpRequest*/
async function getData(){
    carrinho = new Carrinho();
    let responseProduto = await fetch(listar_produto_URL);
    lista_produtos = await responseProduto.json();

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
//2 funcões chamada no carregamento da pagina
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
        //array de produtoCarrinho
        this.HTMLimgCarrinho=document.getElementById('imagemCarrinho');
        this.HTMLcarrinhoQTD= document.getElementById('carrinhoContador');
        this.HTMLcarrinhoSubtotal = document.getElementById('carrinho_subtotal')
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
        console.log(carrinho.HTMLcarrinhoSubtotal);
        dadosCliente.push(request.response);
        rua.value = dadosCliente[0].logradouro;
        bairro.value = dadosCliente[0].bairro;
        cidade.value = dadosCliente[0].localidade;
        uf.value = dadosCliente[0].uf;
        nomeInput = document.getElementById("nome").value
        cpfInput = document.getElementById("cpf").value
        var dadosC = [{nome: nomeInput}, {cpf: cpfInput}];
        dadosCliente.push(dadosC);
        numInput = document.getElementById("numero").value
        complInput = document.getElementById("complemento").value
        var dadosCCompl = [{numero: numInput}, {complemento: complInput}];
        dadosCliente.push(dadosCCompl);
  };
}

/* Envia a requisicao para o backend */
function enviaRequisicao(){
    nomeCliente = document.getElementById("nome").value + "&";
    nomeCliente = encodeURI(nomeCliente);
    cpfCliente = "cpf=" + document.getElementById("cpf").value + "&cep=";
    numCliente = "&numero=" + document.getElementById("numero").value + "&";
    complCliente = "complemento=" + document.getElementById("complemento").value;
    
    const RequisicaoURL = "http://loja.buiar.com/?key=35xkr4&c=pedido&t=inserir&f=json&nome=" + nomeCliente + cpfCliente + dadosCliente[0].cep 
    + "&rua=" + encodeURI(dadosCliente[0].logradouro) + "&bairro=" + encodeURI(dadosCliente[0].bairro) + "&uf=" + dadosCliente.uf + "&rua=" 
    + encodeURI(dadosCliente[0].logradouro) + "&cidade=" + encodeURI(dadosCliente[0].localidade) + numCliente + complCliente;
    console.log(RequisicaoURL);
    let request = new XMLHttpRequest();
    request.open('GET', RequisicaoURL);
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
function resumoDadosEPedidos(){
    console.log(carrinho.produto);
    /* Info do pedido */
    for (var i = 0; i < carrinho.produto.length; i++){
        const texto1 = document.createTextNode(" " + carrinho.produto[i].nome + "; ");
        const tag1 = document.getElementById('infoNomeProd');
        tag1.appendChild(texto1);

        const texto2 = document.createTextNode(" " + carrinho.produto[i].descricao + "; ");
        const tag2 = document.getElementById('infoDescricao');
        tag2.appendChild(texto2);

        const texto3 = document.createTextNode(" " + carrinho.produto[i].preco + "; ");
        const tag3 = document.getElementById('infoPreco');
        tag3.appendChild(texto3);

        const texto4 = document.createTextNode(" " + carrinho.produto[i].quantidade + "; ");
        const tag4 = document.getElementById('infoQuantidade');
        tag4.appendChild(texto4);
    }
    /* info do cliente */
    const texto5 = document.createTextNode(" " + dadosCliente[1][0].nome);
    const tag5 = document.getElementById('infoNomeCliente');
    tag5.appendChild(texto5);

    const texto6 = document.createTextNode(" " + dadosCliente[1][1].cpf);
    const tag6 = document.getElementById('infoCPF');
    tag6.appendChild(texto6);

    const texto7 = document.createTextNode(" " + dadosCliente[0].cep);
    const tag7 = document.getElementById('infoCEP');
    tag7.appendChild(texto7);

    const texto8 = document.createTextNode(" " + dadosCliente[0].logradouro + ", " + dadosCliente[0].bairro + " - " + dadosCliente[0].localidade + ", " + dadosCliente[0].uf);
    const tag8 = document.getElementById('infoEndereco');
    tag8.appendChild(texto8);

    const texto9 = document.createTextNode(" " + dadosCliente[2][0].numero + ", " + dadosCliente[2][1].complemento);
    const tag9 = document.getElementById('infoComplemento');
    tag9.appendChild(texto9);

    const texto10 = document.createTextNode(carrinho.getSubtotalCarrinho().toLocaleString('pt-br', { style: 'currency', currency: 'BRL'}));
    const tag10 = document.getElementById('infoTotal');
    tag10.appendChild(texto10);
}

function nChamadasDeInsercao(idPedido){
    for (var i = 0; i < carrinho.produto.length; i++){
        insereItensPedido(i, idPedido);
    }
}

/* Insere itens no pedido */
function insereItensPedido(i, idPedido){
    //carrinho.produto[0].codigo
    console.log(idPedido);
    const insereItensURL = "http://loja.buiar.com/?key=35xkr4&c=item&t=inserir&f=json&pedido="+ idPedido +"&produto=" + carrinho.produto[i].id + "&qtd=" + carrinho.produto[i].quantidade;
    console.log(insereItensURL)
    let request = new XMLHttpRequest();
    request.open('GET', insereItensURL);
    request.responseType = 'json';
    request.send();
    request.onload = function() {
        let data = request.response;
        resumoPedido(data.dados.id);
  }; 
}

function resumoPedido(idProduto){
    const numero = document.createTextNode(" " + idProduto);
    console.log(idProduto);
    const tag = document.getElementById('infoNumPedido');
    tag.appendChild(numero);

    var urlBoleto = "http://loja.buiar.com/?key=35xkr4&c=boleto&t=listar&id=" + idProduto;

    const boleto = document.createTextNode(" " + urlBoleto);
    const tag1 = document.getElementById('infoBoleto');
    tag1.appendChild(boleto);

    /* var texto = idProduto;
    var hElement = document.createElement("H1");
    var tElement = document.createTextNode(texto);
    hElement.appendChild(tElement);
    document.getElementById('resumoPedido').appendChild(hElement); */
}

/* Após a efetivação do pedido, deverá ser montada a tela de confirmação 
    indicado o número do pedido efetuado. Neste ponto o carrinho de compras deve ser esvaziado. */