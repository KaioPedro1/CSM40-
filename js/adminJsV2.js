google.charts.load('current', {'packages':['table','controls']});

const fipe_URL = "https://parallelum.com.br/fipe/api/v1/carros/marcas";
const loja_categoria_URL = "http://loja.buiar.com/?key=35xkr4&f=json&c=categoria&t=listar"
const loja_produto_URL = "http://loja.buiar.com/?key=35xkr4&f=json&c=produto&t=listar"
const loja_remover_prod_URL = "http://loja.buiar.com/?key=35xkr4&f=json&c=produto&t=remover&id="
const loja_remover_cate_URL = "http://loja.buiar.com/?key=35xkr4&f=json&c=categoria&t=remover&id="
const loja_pedido_URL="http://loja.buiar.com/?key=35xkr4&f=json&c=pedido&t=listar"
const loja_pedido_item_URL = "http://loja.buiar.com/?key=35xkr4&f=json&c=item&t=listar&pedido="
/*existe uma maneira correta de buscar pela api,  que é importando a biblioteca e instanciando uma classe do google search, mas não consegui e vai ser pela url mesmo. O "cx" é a chave da search engine que é gerada pelo google cloud e a key é a chave da api também gerada vinculada com a conta google"*/
const googleSearchURL = "https://customsearch.googleapis.com/customsearch/v1?cx=57045d6ec622c4289&searchType=image&key=AIzaSyB8XoAfOHeb5aS4odsWv9yTFvc9S0GadAE&num=1&q="


var lista_produtos
var lista_categoria
var lista_marcas
var lista_pedidos
var obj_veiculo;
var categoria_hash_map = new Map()

/*executa só uma vez na inicialização, pega todos os dados de forma assincrona */
const loadData = async () =>{
    const results = await Promise.all([
        fetch(loja_produto_URL),
        fetch(loja_categoria_URL),
        fetch(fipe_URL),
        fetch(loja_pedido_URL)
    ])
    const dataPromises =  results.map(result => result.json());
    const data = await Promise.all(dataPromises);
    lista_produtos = data[0];
    lista_categoria = data[1];
    lista_marcas = data[2];
    lista_pedidos= data[3].dados;

    for(let k=0; k<lista_categoria.dados.length;k++){
        categoria_hash_map.set(lista_categoria.dados[k].id, lista_categoria.dados[k].nome)
        }

    google.charts.setOnLoadCallback(drawCategoriaChart);
    google.charts.setOnLoadCallback(drawProdutoChart);

    /*servem para preencher os campos de selecao inicial, não sabia onde colocar, coloquei aqui pq precisa esperar os request acima preencher as lista globais*/
    genericaPreencheSelection('selectCategoria',lista_categoria.dados);
    genericaPreencheSelection('selectMarca',lista_marcas, preencheSelectionNome, 'selectAnoFipe');



};loadData();
/*removendo envio automatico do formulario por url e setando eventos*/
document.addEventListener("DOMContentLoaded", ()=>
{
    let formCategoria = document.getElementById('form_categoria');
    formCategoria.addEventListener("submit",function(event){
        event.preventDefault();
        adicionarCategoria(event);
    });
    let formProdutos = document.getElementById('form_produtos');
    formProdutos.addEventListener("submit",function(event){
        event.preventDefault();
        adicionarProduto(event);
    });

    let formAlterarProdutos = document.getElementById('modal_produtos_alterar');
    formAlterarProdutos.addEventListener("submit",function(event){
        event.preventDefault();
        alterarProduto(event);
    });

    let selecaoNome = document.getElementById('selectNomeFipe');
    selecaoNome.addEventListener('change',preencheSelectionAnoModelo)

    let selectAnoFipe = document.getElementById('selectAnoFipe');
    selectAnoFipe.addEventListener('change',preencheCampoPreco);
})
//2 funçoes da biblioteca do google para gerar a tabela
function drawProdutoChart(){
    let dadosTratados=[];
    var dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'));
            var filtro_categoria = new google.visualization.ControlWrapper({
                'controlType': 'CategoryFilter',
                'containerId': 'filtro_div_prod',
                'options': {
                    'filterColumnLabel': 'Categoria',
                    'ui': {'labelStacking': 'vertical'}
                }
              });
            var tabela = new google.visualization.ChartWrapper({
                'chartType': 'Table',
                'containerId': 'display_tabela_prod',
                'options': {
                    showRowNumber: true,
                    allowHtml: true,
                    'width': '100%'
                }
              });
    //juntaod o filtro categoria com a tabela
    dashboard.bind([filtro_categoria],tabela);

    let cabecalho = ['Id', 'Codigo', 'Categoria', 'Nome', 'Descricao', 'Preco', 'URL ou caminho imagem', 'Peso', 'Eventos/Açoes']
    dadosTratados.push(cabecalho);
    for(let k=0; k<lista_produtos.dados.length;k++){
        let btnRemover=criaBotao("Remover", lista_produtos.dados[k].nome, lista_produtos.dados[k].id,'removerProduto');
        let btnAlterar = criaBotao("Alterar",lista_produtos.dados[k].nome, lista_produtos.dados[k].id, 'alterarProduto');
        let valores=Object.values(lista_produtos.dados[k])
        valores.push(btnRemover+btnAlterar)
        dadosTratados.push(valores);
    }
    dadosTratados=tratamentoProdutos(dadosTratados)
    let dadosTabela=google.visualization.arrayToDataTable(dadosTratados);
    dashboard.draw(dadosTabela); 
}
function drawCategoriaChart(){
  
    var tabela = new google.visualization.ChartWrapper({
        'chartType': 'Table',
        'containerId': 'displayTabela_cat',
        'options': {
            showRowNumber: true,
            allowHtml: true,
            'width': '100%'
        }
      });
    let dados=[['Categoria', 'ID', 'Eventos']];

    for(let k=0; k<lista_categoria.dados.length; k++){
        let btnRemover=criaBotao("Remover", lista_categoria.dados[k].nome, lista_categoria.dados[k].id,'removerCategoria');
        let btnAlterar = criaBotao("Alterar",lista_categoria.dados[k].nome, lista_categoria.dados[k].id, 'alterarCategoria');
        dados.push([lista_categoria.dados[k].nome,
       lista_categoria.dados[k].id, btnRemover+btnAlterar]);
    }
    let dadosTabela=google.visualization.arrayToDataTable(dados);
    tabela.setDataTable(dadosTabela);
    tabela.draw();
}
//2 funções para gerar o historico de pedido
//preenche os detalhes do pedido nas duas divs da direita
function detalhes_pedidos(id, obj){
    detalhesHTML = document.getElementById('detalhes_pedidos');
    itensHTML = document.getElementById('detalhes_pedidos_item');
    //limpa as divs html
    while (detalhesHTML.firstChild) {
        detalhesHTML.firstChild.remove();
    }
    while (itensHTML.firstChild) {
        itensHTML.firstChild.remove();
    }
    //loop pelo objeto para inserir as informações na div de detalhes do pedido
    Object.entries(obj).forEach(([key, value]) => 
    {
        let novoElemento = document.createElement('div');
        novoElemento.classList.add("row");
        novoElemento.innerText=key+': '+value;
        detalhesHTML.appendChild(novoElemento)
        detalhesHTML.appendChild(document.createElement('hr'))
    });
    //requisição assincrona para coleta dos itens do pedido, data é a resposta em json, depois de obter os dados é feita a criação dos elementos na div detalhes do produto
    fetch(loja_pedido_item_URL+id).then(res => res.json()).then(data=>{
        //caso não tenha nenhuma inserção de item
        if(data.dados.length==0){
            let item= document.createElement('div');
            item.classList.add("row");
            item.innerText="Pedido não possui nenhum item vinculado ao seu id!"
            itensHTML.appendChild(item)
            itensHTML.appendChild(document.createElement('hr'))
        }else{
            let preco = 0
            for(let j=0; j<data.dados.length; j++){
                //loop para achar o nome do produto pelo id
                for(let i = 0; i<lista_produtos.dados.length; i++){
                    if(data.dados[j].produto==lista_produtos.dados[i].id){
                        data.dados[j].produto=lista_produtos.dados[i].nome;
                        preco=parseFloat(lista_produtos.dados[i].preco)
                        break;
                    }
                }
                //cria html para inserir no itensHTML
                let item= document.createElement('div');
                item.classList.add("row");
                item.innerHTML=`<h4>Item número: ${data.dados[j].id}</h4>
                <p>Pedido:${data.dados[j].pedido}</p></hr>
                <p>Produto:${data.dados[j].produto}</p></hr>
                <p>Quantidade:${data.dados[j].qtd}</p></hr>
                <p>Valor total:${(preco*data.dados[j].qtd).toLocaleString('pt-br', { style: 'currency', currency: 'BRL'})}</p></hr>
                <a href="http://loja.buiar.com/?key=35xkr4&c=boleto&t=listar&id=${data.dados[j].pedido}" target="_blank">Link para o boleto</a>
                `    
                itensHTML.appendChild(item)
                itensHTML.appendChild(document.createElement('hr'))
            }
        }
    
    })
    

}
//gera os pedidos na div da esquerda da tela
function gera_pedidos(){
    lista_pedidosHTML = document.getElementById('lista_pedidos');
    while (lista_pedidosHTML.firstChild) {
        lista_pedidosHTML.firstChild.remove();
    }
    for(let k = 0 ; k<lista_pedidos.length;k++){
        let novoElemento = document.createElement('li');
        novoElemento.setAttribute('class', 'list-group-item d-flex justify-content-between align-items-start list-group-item-action');
        novoElemento.id=lista_pedidos[k].id;
        novoElemento.addEventListener('click', function(){
            detalhes_pedidos(lista_pedidos[k].id, lista_pedidos[k]);
        });
        novoElemento.innerHTML=` <div class="ms-2 me-auto">
        <div class="fw-bold">Pedido ID:${lista_pedidos[k].id}</div>
        Cliente:${lista_pedidos[k].nome}, CPF: ${lista_pedidos[k].cpf}, CEP: ${lista_pedidos[k].cep}
        </div>`
        lista_pedidosHTML.appendChild(novoElemento)
    }
} 

//2 funcoes de utilidades
function criaBotao(value, name, id, funcName){
    if(funcName=='alterarCategoria'){
        return `<input type="button" class="btn btn-secondary" value=${value} name=${name} id=${id} onclick="${funcName}(this.id)"data-bs-toggle="modal" data-bs-target="#modal_categoria"/>`
    }
    else if(funcName=='alterarProduto'){
        return `<input type="button" class="btn btn-secondary" value=${value} name=${name} id=${id} onclick="genericaPreencheSelection('produto_input_categoria', lista_categoria.dados); preencheFormAlterarProduto(this.id)" data-bs-toggle="modal" data-bs-target="#modal_produtos_alterar"/>`
    }
    else{
        return `<input type="button" class="btn btn-secondary" value=${value} name=${name} id=${id} onclick="${funcName}(this.id)"/>`
    }
}
function tratamentoProdutos(dados2){
    var formato = { minimumFractionDigits: 2 , style: 'currency', currency: 'BRL', maximumFractionDigits: 3 }
    /*transforma o id da categoria para nome e converte em BRL o preco*/
    let dados = dados2
    for(let k=1; k<dados.length;k++){
        dados[k][2] = categoria_hash_map.get(dados[k][2])
        dados[k][5] = parseInt(dados[k][5]).toLocaleString('pt-br', formato)
    }
    return dados
}
//7 funções para o crud, pode ser reduzido, mas para facilitar a legibilidade vai ser assim mesmo
function removerCategoria(intID){
    let varURL = loja_remover_cate_URL+JSON.stringify(intID);
    let request = new XMLHttpRequest();
    request.open('POST', varURL);
    request.responseType='json';
    request.send();
    request.onload=function(){
        atualizaLista('categoria')
    }
}
function removerProduto(intID){
    let varURL = loja_remover_prod_URL+JSON.stringify(intID);
    let request = new XMLHttpRequest();
    request.open('POST', varURL);
    request.responseType='json';
    request.send();
    request.onload=function(){
        atualizaLista('produto')
    }
}
function atualizaLista(tipo){
    if(tipo=='categoria'){
        fetch(loja_categoria_URL).then(res => res.json()).then(data=>{
            lista_categoria=data 
            categoria_hash_map.clear();
            for(let k=0; k<lista_categoria.dados.length;k++)
            {
            categoria_hash_map.set(lista_categoria.dados[k].id, lista_categoria.dados[k].nome)
            }
            drawCategoriaChart()
        });
    }
    else if(tipo == 'produto'){
        fetch(loja_produto_URL).then(res => res.json()).then(data=>{lista_produtos=data, drawProdutoChart()})
    }
}
function alterarCategoria(intID){
    document.getElementById('exampleModalLabel').innerText='Alterar categoria '+intID;
    document.getElementById('categoria_btn_enviar').innerText='Alterar';
    document.getElementById('categoria_input_nome').value = categoria_hash_map.get(intID);
}
function alterarProduto(e){
    e.preventDefault();
    let varURL = "http://loja.buiar.com/?key=35xkr4&f=json&c=produto&t=alterar";
    let temp = Array.from(e.target.elements);
    var obj_backEnd = new dadosBackend(temp, document.getElementById('modal_alterar_produtos').innerText.split(' ')[2]);
    //cria a url 
    Object.entries(obj_backEnd).forEach(([key, value]) => 
    {
            varURL= varURL.concat('&'+key+'='+value);   
    });
    console.log(varURL)
    let requestXML = new XMLHttpRequest();
    requestXML.open('POST', varURL);
    requestXML.responseType='json';
    requestXML.send();
    requestXML.onload=function()
    {
        for(let k = 0; k<lista_produtos.dados.length;k++){
            if(lista_produtos.dados[k].id == obj_backEnd.id){
                lista_produtos.dados[k]=obj_backEnd;
                drawProdutoChart();
            }
        }
        
    }
}
function adicionarCategoria(e){
    e.preventDefault();
    //condicional para verificar qual botão foi pressionado, reutilizei essa função pq só tem um campo para alterar na categoria
    if(document.getElementById('categoria_btn_enviar').innerText=='Alterar'){
        let varURL = "http://loja.buiar.com/?key=35xkr4&f=json&c=categoria&t=alterar&id="+document.getElementById('exampleModalLabel').innerText.split(' ')[2]+'&nome=';
        let temp = e.target.elements;
        varURL+=temp[0].value;
        let request = new XMLHttpRequest();
        request.open('POST', varURL);
        request.responseType='json';
        request.send();
        request.onload=function(){
            /*só adiciona o objeto a lista, não faz outra requisição xml */
            for(let k=0; k<lista_categoria.dados.length; k++)
            {
                if(categoria_hash_map.get(document.getElementById('exampleModalLabel').innerText.split(' ')[2])==lista_categoria.dados[k].nome){
                    lista_categoria.dados[k].nome=temp[0].value;
                }
            }
            drawCategoriaChart();
        }
    }
    else{
        let varURL = "http://loja.buiar.com/?key=35xkr4&f=json&c=categoria&t=inserir&nome=";
        let temp = e.target.elements;
        //só tem 1 elemento para ser alterado
        varURL+=temp[0].value;
        let request = new XMLHttpRequest();
        request.open('POST', varURL);
        request.responseType='json';
        request.send();
        request.onload=function(){
            /*só adiciona o objeto a lista, não faz outra requisição xml */
            lista_categoria.dados.push({id:request.response.dados.id, nome: temp[0].value})
            for(let k=0; k<lista_categoria.dados.length;k++){
                categoria_hash_map.set(lista_categoria.dados[k].id, lista_categoria.dados[k].nome)
                }
            drawCategoriaChart();
        }
    }    
}
function adicionarProduto(e)
{
    e.preventDefault();
    let varURL = "http://loja.buiar.com/?key=35xkr4&f=json&c=produto&t=inserir";
    let temp = Array.from(e.target.elements);
    var obj_backEnd = new dadosBackend(temp);
    //gera  url sem a imagem, pois ela é trada logo abaixo
    Object.entries(obj_backEnd).forEach(([key, value]) => 
    {
        if(key!='id' && key!='imagem')
        {
            varURL= varURL.concat('&'+key+'='+value);   
        }
    });    
    //se o campo de imagem não for preenchido, pega do google imagens usando a api google search engine
    if(obj_backEnd.imagem==undefined || obj_backEnd.imagem ==""){
        //requisição assincrona para pegar uma imagem do google do veiculo
        fetch(googleSearchURL+obj_backEnd.nome).then(res => res.json()).then(data=>{
            obj_backEnd.imagem = data.items[0].link;
            varURL= varURL.concat('&imagem'+'='+obj_backEnd.imagem);
            let requestXML = new XMLHttpRequest();
            requestXML.open('POST', varURL);
            requestXML.responseType='json';
            requestXML.send();
            requestXML.onload=function()
            {
                obj_backEnd.id=requestXML.response.dados.id;
                lista_produtos.dados.push(obj_backEnd);
                drawProdutoChart();
            }
        })
    }
    else
    {   
        obj_backEnd.imagem = 'imagens/veiculos/'+obj_backEnd.imagem;
        varURL= varURL.concat('&imagem'+'='+obj_backEnd.imagem); 
        let request = new XMLHttpRequest();
        request.open('POST', varURL);
        request.responseType='json';
        request.send();
        request.onload=function()
        {
        obj_backEnd.id=request.response.dados.id;
        lista_produtos.dados.push(obj_backEnd);
        drawProdutoChart();
        }
    }
}
    
//5 funções para preencher os campos da tabela fipe
function preencheFormAlterarProduto(id){
    document.getElementById('modal_alterar_produtos').innerText='Alterar produto '+id
    for(let k = 0; k<lista_produtos.dados.length; k++){
        if(lista_produtos.dados[k].id==id){
            document.getElementById('produto_input_marca').value = lista_produtos.dados[k].descricao.split(',')[0];
            document.getElementById('produto_input_nome').value = lista_produtos.dados[k].nome;
            document.getElementById('produto_input_ano').value = lista_produtos.dados[k].descricao.split(',')[1].split(': ')[1]+' '+ lista_produtos.dados[k].descricao.split(',')[2].split(': ')[1];
            document.getElementById('produto_input_preco').value = lista_produtos.dados[k].preco;
            document.getElementById('produto_input_categoria').value = lista_produtos.dados[k].categoria;
            document.getElementById('produto_input_codigo').value = lista_produtos.dados[k].codigo;
            document.getElementById('produto_input_peso').value = lista_produtos.dados[k].peso;
            document.getElementById('produto_input_imagem').value = lista_produtos.dados[k].imagem;
            var tempDesc=','
            for(let j = 3; j<lista_produtos.dados[k].descricao.split(',').length-1; j++){
        
                tempDesc+=lista_produtos.dados[k].descricao.split(',')[j]+',';
            }
            document.getElementById('produto_input_descricao').value = tempDesc;
            return
        }
         
    }
   
}
function genericaPreencheSelection(htmlID,lista,func){
    let selecao = document.getElementById(htmlID);

    while (selecao.firstChild) {
        selecao.firstChild.remove();
    }
    let option=[];
    for(let k=0; k<lista.length; k++){
        option.push(document.createElement("option"));
        option[k].text=lista[k].nome;
        if(lista[k].id == undefined){
            option[k].value=lista[k].codigo;
        }else{
            option[k].value=lista[k].id;
        }
    
        selecao.appendChild(option[k]);
    } 
    if(func!=undefined){
        selecao.addEventListener('change',func)
    } 
}
function preencheSelectionNome(e){ 
    let varURL = fipe_URL+"/"+e.currentTarget.value+"/modelos";
    let lista_nome_veic;
    let option = [];  
    let selecao = document.getElementById('selectNomeFipe');
    let selecao2 = document.getElementById('selectAnoFipe')

    while (selecao.firstChild) {
        selecao.firstChild.remove();
    }
    try {
        while(selecao2.firstChild){
        selecao2.firstChild.remove();
        }
        selecao2.disabled=true;
    } catch (error) {
       
    }
    selecao.disabled=false;
    /*requisição assincrona modelos, pensar de outra maneira para não precisar fazer essa requisão toda vez que atualizar a lista */
    fetch(varURL).then(res => res.json()).then(data=>{
        lista_nome_veic=data.modelos; 
        for(let k=0; k<lista_nome_veic.length; k++){
            option.push(document.createElement("option"));
            option[k].text=lista_nome_veic[k].nome;
            option[k].value=lista_nome_veic[k].codigo;
            selecao.appendChild(option[k]);
        }      
    });
    
}
function preencheSelectionAnoModelo(e){
    let selecaoMarcaFipe = document.getElementById('selectMarca')
    let selecaoNomeFipe = document.getElementById('selectNomeFipe')
    let selecaoAnoFipe = document.getElementById('selectAnoFipe')

    marcaID = selecaoMarcaFipe.options[selecaoMarcaFipe.selectedIndex].value;
    nomeID= selecaoNomeFipe.options[selecaoNomeFipe.selectedIndex].value;
    let lista_ano_veic;
    let option = []; 
    let varURL = fipe_URL+"/"+marcaID+"/modelos/"+nomeID+"/anos";

    while (selecaoAnoFipe.firstChild) {
        selecaoAnoFipe.firstChild.remove();
    }
    selecaoAnoFipe.disabled=false;
    fetch(varURL).then(res => res.json()).then(data=>{
        lista_ano_veic = data;
        for(let k=0; k<lista_ano_veic.length; k++){
            option.push(document.createElement("option"));
            option[k].text=lista_ano_veic[k].nome;
            option[k].value=lista_ano_veic[k].codigo;
            selecaoAnoFipe.appendChild(option[k]);
        }   
    })
}
function preencheCampoPreco(e){
    let selecaoMarcaFipe = document.getElementById('selectMarca')
    let selecaoNomeFipe = document.getElementById('selectNomeFipe')
    let selecaoAnoFipe = document.getElementById('selectAnoFipe')
    let selecaoPrecoFipe = document.getElementById('selectPrecoFipe')
    
    marcaID = selecaoMarcaFipe.options[selecaoMarcaFipe.selectedIndex].value;
    nomeID= selecaoNomeFipe.options[selecaoNomeFipe.selectedIndex].value;
    anoID =selecaoAnoFipe.options[selecaoAnoFipe.selectedIndex].value;

    let varURL = fipe_URL+"/"+marcaID+"/modelos/"+nomeID+"/anos/"+anoID;

    fetch(varURL).then(res => res.json()).then(data=>{
        obj_veiculo = data;
        selecaoPrecoFipe.value=obj_veiculo.Valor;
    })
}
//teste criminoso
class dadosBackend{
    //não da pra criar dois construtores nessa linguagem, por isso tem essa condicional para verificar se a chamada é para alterar ou somente inserir, acho que não faz sentido criar uma classe para isso, fiz assim só para testar mesmo
    constructor(arrayForm, alterarID){
        if(alterarID){
        this.id=alterarID;
        this.nome=arrayForm[1].value;
        this.descricao=arrayForm[0].value+", Ano modelo: "+arrayForm[2].value.split(' ')[0]+ ", Combustível: "+arrayForm[2].value.split(' ')[1]+", "+arrayForm[9].value;
        this.preco=parseFloat(arrayForm[3].value);
        this.imagem = arrayForm[7].value;
        }
        else
        {
        this.id=null;
        this.nome=arrayForm[1].options[arrayForm[1].selectedIndex].textContent;
        //usei o objeto global ao invés do formulario, pode dar problema
        this.descricao=obj_veiculo.Marca+", Ano modelo: "+obj_veiculo.AnoModelo+ ", Combustível: "+obj_veiculo.Combustivel+", "+arrayForm[9].value;
        this.preco=parseFloat(arrayForm[3].value.split('R$ ')[1].split('.').join('').split(',').join('.'));
        this.imagem = arrayForm[7].value.split('\\')[2]
        }
        this.codigo=arrayForm[5].value;
        this.categoria=arrayForm[4].value;
        this.peso=arrayForm[6].value;
    }
}